import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { parseCadastralPdf } from './pdf_parser.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runSecurityAudit() {
  console.log('================================================================');
  console.log('🛡️  SKY CADASTRAL — ADVERSARIAL SECURITY & BREAK AUDIT TEST');
  console.log('================================================================\n');

  let vulnerabilitiesFound = [];
  let defensesPassed = 0;
  let totalTests = 0;

  function reportDefense(testName, passed, vulnDetails) {
    totalTests++;
    if (passed) {
      defensesPassed++;
      console.log(`  🛡️  [DEFENDED] ${testName}`);
    } else {
      vulnerabilitiesFound.push({ testName, vulnDetails });
      console.error(`  ⚠️  [VULNERABLE / BROKEN] ${testName}`);
      console.error(`     └─ ${vulnDetails}`);
    }
  }

  // --------------------------------------------------------------------------
  // TEST 1: Path Traversal via string path parameter
  // --------------------------------------------------------------------------
  console.log('[SECURITY TEST 1: Path Traversal & Arbitrary Local File Probing]');
  try {
    const maliciousPaths = [
      '../../../../../../Windows/win.ini',
      '../../../../../../etc/passwd',
      '../.env',
      './.env',
      'package.json'
    ];

    for (const malPath of maliciousPaths) {
      try {
        await parseCadastralPdf(malPath);
        reportDefense(`Path traversal with "${malPath}"`, false, 'System executed or attempted to parse non-PDF local file without path restriction!');
      } catch (err) {
        // If it rejects BEFORE calling Python with an explicit security error, that's secure.
        // If it throws because Python failed on non-PDF, it probed the filesystem.
        const isSecureRejection = err.message.includes('Invalid file type') ||
                                  err.message.includes('Security') ||
                                  err.message.includes('not a valid PDF') ||
                                  err.message.includes('Path traversal') ||
                                  err.message.includes('Restricted path');
        
        if (isSecureRejection) {
          reportDefense(`Path traversal blocked for "${malPath}"`, true);
        } else {
          reportDefense(`Path traversal probe for "${malPath}"`, false, `File access leaked to engine: "${err.message.slice(0, 80)}"`);
        }
      }
    }
  } catch (err) {
    console.error('Test 1 error:', err);
  }

  // --------------------------------------------------------------------------
  // TEST 2: Null Byte Injection & CLI Flag Injection
  // --------------------------------------------------------------------------
  console.log('\n[SECURITY TEST 2: Null Byte & Argument Flag Injection]');
  try {
    const flagPayloads = [
      '--version.pdf',
      '-c.pdf',
      'sample.pdf\0.png',
      ';calc.exe.pdf'
    ];

    for (const payload of flagPayloads) {
      try {
        await parseCadastralPdf(payload);
        reportDefense(`Flag injection with "${payload}"`, false, 'Engine executed without argument sanitization');
      } catch (err) {
        const isCleanRejection = !err.message.includes('Traceback') &&
                                (err.message.includes('Security') ||
                                 err.message.includes('Invalid') ||
                                 err.message.includes('not found') ||
                                 err.message.includes('Illegal'));
        reportDefense(`Flag injection rejected for "${payload}"`, isCleanRejection, `Error message: ${err.message.slice(0, 80)}`);
      }
    }
  } catch (err) {
    console.error('Test 2 error:', err);
  }

  // --------------------------------------------------------------------------
  // TEST 3: Fake PDF / Disguised Polyglot Injection
  // --------------------------------------------------------------------------
  console.log('\n[SECURITY TEST 3: Fake PDF, Corrupt Streams & Polyglots]');
  
  // 3.1: Zero-byte buffer
  try {
    await parseCadastralPdf(Buffer.alloc(0));
    reportDefense('Zero-byte buffer rejection', false, 'Allowed 0-byte buffer');
  } catch (err) {
    const passed = err.message.includes('empty') || err.message.includes('Invalid') || err.message.includes('zero');
    reportDefense('Zero-byte buffer rejected immediately', passed, err.message);
  }

  // 3.2: Plain HTML disguised as PDF (size > 50 bytes)
  const fakeHtml = Buffer.from('<!DOCTYPE html><html><head><title>Test Plan</title></head><body><script>alert("xss")</script></body></html>');
  try {
    await parseCadastralPdf(fakeHtml);
    reportDefense('Fake HTML buffer rejection', false, 'Engine processed HTML file without magic bytes check');
  } catch (err) {
    const passed = err.message.includes('header') || err.message.includes('magic') || err.message.includes('valid %PDF-');
    reportDefense('Fake HTML rejected by magic byte check', passed, `Engine response: ${err.message.slice(0, 80)}`);
  }

  // 3.3: Polyglot with %PDF- header comment in middle of JavaScript/HTML
  const polyglot = Buffer.from('// JavaScript Header comment\n/* %PDF-1.4 comment */\nconst x = 1;\nprocess.exit(1);\n'.repeat(3));
  try {
    await parseCadastralPdf(polyglot);
    reportDefense('Polyglot file rejection', false, 'Polyglot bypassed magic bytes check');
  } catch (err) {
    const passed = err.message.includes('header') || err.message.includes('magic') || err.message.includes('valid %PDF-');
    reportDefense('Polyglot rejected (header must start at offset 0)', passed, `Engine response: ${err.message.slice(0, 80)}`);
  }

  // 3.4: Corrupt truncated PDF stream
  const corruptPdf = Buffer.from('%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\n%%EOF');
  try {
    const res = await parseCadastralPdf(corruptPdf);
    // If it gracefully returns an empty plot list or safely rejects without unhandled crash
    reportDefense('Malformed PDF structure handled safely without crash', res && Array.isArray(res.plots), 'Safe handling of empty/truncated PDF');
  } catch (err) {
    reportDefense('Malformed PDF rejected gracefully with clean error', !err.message.includes('Unhandled'), err.message.slice(0, 80));
  }

  // --------------------------------------------------------------------------
  // TEST 4: Temporary File Isolation & Security
  // --------------------------------------------------------------------------
  console.log('\n[SECURITY TEST 4: Temporary File Isolation & Insecure Storage]');
  
  // Verify where temp files are created:
  // Currently pdf_parser.js creates temp files in `__dirname`! That is insecure.
  const sampleBuf = fs.readFileSync(path.join(__dirname, 'sample_cadastral_layout.pdf'));
  
  // Let's inspect pdf_parser.js source code to check temp file location
  const parserCode = fs.readFileSync(path.join(__dirname, 'pdf_parser.js'), 'utf8');
  const writesToDirname = parserCode.includes("path.join(__dirname, `temp_cadastral_");
  reportDefense(
    'Temporary files stored in dedicated OS temp directory rather than source code root',
    !writesToDirname,
    writesToDirname ? 'Insecure: pdf_parser.js creates temp files directly in __dirname application source directory!' : 'Secure temp directory used'
  );

  // --------------------------------------------------------------------------
  // TEST 5: Cleanup Guarantee on Processing Failure
  // --------------------------------------------------------------------------
  console.log('\n[SECURITY TEST 5: Temp File Cleanup Guarantee on Error]');
  const countBefore = fs.readdirSync(__dirname).filter(f => f.startsWith('temp_cadastral_')).length;
  try {
    // Pass corrupted buffer that causes Python to fail
    await parseCadastralPdf(Buffer.from('not a real pdf content at all'));
  } catch (_) {}
  const countAfter = fs.readdirSync(__dirname).filter(f => f.startsWith('temp_cadastral_')).length;
  reportDefense(
    'No orphan temp files left behind after failed parsing',
    countAfter === countBefore,
    `Orphan temp files created in __dirname: ${countAfter - countBefore}`
  );

  // --------------------------------------------------------------------------
  // SUMMARY
  // --------------------------------------------------------------------------
  console.log('\n================================================================');
  console.log(`📊 SECURITY AUDIT SUMMARY: ${defensesPassed}/${totalTests} DEFENSES ACTIVE`);
  console.log(`🚨 VULNERABILITIES / WEAKNESSES IDENTIFIED: ${vulnerabilitiesFound.length}`);
  console.log('================================================================');

  vulnerabilitiesFound.forEach((v, idx) => {
    console.log(`\n[Vulnerability ${idx + 1}]: ${v.testName}`);
    console.log(`  Problem: ${v.vulnDetails}`);
  });

  return vulnerabilitiesFound;
}

runSecurityAudit().catch(err => console.error('Fatal audit error:', err));
