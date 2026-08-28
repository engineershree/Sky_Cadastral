// Mock Data for Sky Cadastral Admin Panel Master Build

export const INITIAL_CUSTOMERS = [
  { id: 'CUST-001', name: 'Apex Developments Ltd.', phone: '+91 98220 12345', email: 'contact@apexdev.com', address: 'Plot 14, Commercial Hub, Pune' },
  { id: 'CUST-002', name: 'Meridian Civic Authority', phone: '+91 98221 23456', email: 'admin@meridiancivic.org', address: 'Civil Lines, Sector 4, Mumbai' },
  { id: 'CUST-003', name: 'Rajesh & Sunita Sharma', phone: '+91 98222 34567', email: 'rajesh.sharma@gmail.com', address: 'Flat 402, Oakwood Towers, Nashik' },
  { id: 'CUST-004', name: 'State Highway Dept.', phone: '+91 98223 45678', email: 'infra@statehighways.gov.in', address: 'PWD Building, Camp, Pune' },
  { id: 'CUST-005', name: 'Pinnacle Infrastructure', phone: '+91 98224 56789', email: 'projects@pinnacleinfra.co.in', address: 'Suite 801, Tech Park, Hinjewadi' },
  { id: 'CUST-006', name: 'Vikramaditya Patil', phone: '+91 98225 67890', email: 'vikram.patil@outlook.com', address: 'Baner Main Road, Pune' },
  { id: 'CUST-007', name: 'Horizon Green Energy Corp', phone: '+91 98226 78901', email: 'land@horizongreen.com', address: 'MIDC Phase 2, Chakan' },
];

export const INITIAL_PLOTS = [
  {
    id: 'PLOT-A01',
    plotNumber: 'A-01',
    project: 'Sky Cadastral Phase 1',
    area: 1200,
    unit: 'sq.ft',
    length: 40,
    width: 30,
    documentArea: 1200,
    valuation: 2400000,
    pricePerSqFt: 2000,
    status: 'Available',
    location: 'North-East Corner, Sector 1',
    customerName: '',
    customerPhone: '',
    verifiedBy: 'Robert H.',
    verifiedAt: '2026-08-15',
    verificationStatus: 'Verified',
    valuationNotes: 'Corner prime location with 40ft road frontage.',
    documents: [
      { id: 'DOC-101', title: '2D Layout Plan (A-01).pdf', type: '2D Plot Plan PDF', size: '2.4 MB', date: '2026-08-01', url: '#' },
      { id: 'DOC-102', title: 'Demarcation Certificate.pdf', type: 'Measurement Document', size: '1.1 MB', date: '2026-08-02', url: '#' }
    ]
  },
  {
    id: 'PLOT-A02',
    plotNumber: 'A-02',
    project: 'Sky Cadastral Phase 1',
    area: 1500,
    unit: 'sq.ft',
    length: 50,
    width: 30,
    documentArea: 1500,
    valuation: 3000000,
    pricePerSqFt: 2000,
    status: 'Booked',
    location: 'Sector 1, Plot 2',
    customerName: 'Apex Developments Ltd.',
    customerPhone: '+91 98220 12345',
    verifiedBy: 'Robert H.',
    verifiedAt: '2026-08-14',
    verificationStatus: 'Verified',
    valuationNotes: 'Standard residential plot. Booking confirmed with 20% advance.',
    documents: [
      { id: 'DOC-103', title: '2D Layout Plan (A-02).pdf', type: '2D Plot Plan PDF', size: '2.1 MB', date: '2026-08-01', url: '#' },
      { id: 'DOC-104', title: 'Booking Agreement (Apex).pdf', type: 'Ownership Document', size: '3.5 MB', date: '2026-08-20', url: '#' }
    ]
  },
  {
    id: 'PLOT-A03',
    plotNumber: 'A-03',
    project: 'Sky Cadastral Phase 1',
    area: 1800,
    unit: 'sq.ft',
    length: 60,
    width: 30,
    documentArea: 1800,
    valuation: 3600000,
    pricePerSqFt: 2000,
    status: 'Sold',
    location: 'Sector 1, Plot 3',
    customerName: 'Meridian Civic Authority',
    customerPhone: '+91 98221 23456',
    verifiedBy: 'Robert H.',
    verifiedAt: '2026-08-10',
    verificationStatus: 'Verified',
    valuationNotes: 'Fully paid and registered plot. Registry completed.',
    documents: [
      { id: 'DOC-105', title: '2D Layout Plan (A-03).pdf', type: '2D Plot Plan PDF', size: '2.5 MB', date: '2026-08-01', url: '#' },
      { id: 'DOC-106', title: 'Sale Deed (Registered).pdf', type: 'Ownership Document', size: '4.8 MB', date: '2026-08-12', url: '#' }
    ]
  },
  {
    id: 'PLOT-A04',
    plotNumber: 'A-04',
    project: 'Sky Cadastral Phase 1',
    area: 1200,
    unit: 'sq.ft',
    length: 40,
    width: 30,
    documentArea: 1200,
    valuation: 2400000,
    pricePerSqFt: 2000,
    status: 'Available',
    location: 'Sector 1, Plot 4',
    customerName: '',
    customerPhone: '',
    verifiedBy: 'Elena Rostova',
    verifiedAt: '2026-08-18',
    verificationStatus: 'Verified',
    valuationNotes: 'East-facing premium plot.',
    documents: [
      { id: 'DOC-107', title: '2D Layout Plan (A-04).pdf', type: '2D Plot Plan PDF', size: '2.2 MB', date: '2026-08-01', url: '#' }
    ]
  },
  {
    id: 'PLOT-B01',
    plotNumber: 'B-01',
    project: 'Sky Cadastral Phase 2',
    area: 2000,
    unit: 'sq.ft',
    length: 50,
    width: 40,
    documentArea: 2000,
    valuation: 4400000,
    pricePerSqFt: 2200,
    status: 'Available',
    location: 'Commercial Zone, Sector 2',
    customerName: '',
    customerPhone: '',
    verifiedBy: 'Marcus Vance',
    verifiedAt: '2026-08-22',
    verificationStatus: 'Verified',
    valuationNotes: 'Commercial plot suitable for multi-story office building.',
    documents: [
      { id: 'DOC-108', title: '2D Layout Plan (B-01).pdf', type: '2D Plot Plan PDF', size: '3.1 MB', date: '2026-08-05', url: '#' }
    ]
  },
  {
    id: 'PLOT-B02',
    plotNumber: 'B-02',
    project: 'Sky Cadastral Phase 2',
    area: 2400,
    unit: 'sq.ft',
    length: 60,
    width: 40,
    documentArea: 2400,
    valuation: 5280000,
    pricePerSqFt: 2200,
    status: 'Booked',
    location: 'Sector 2, Plot 2',
    customerName: 'Pinnacle Infrastructure',
    customerPhone: '+91 98224 56789',
    verifiedBy: 'Marcus Vance',
    verifiedAt: '2026-08-21',
    verificationStatus: 'Verified',
    valuationNotes: 'Booked for IT hub branch.',
    documents: [
      { id: 'DOC-109', title: '2D Layout Plan (B-02).pdf', type: '2D Plot Plan PDF', size: '2.9 MB', date: '2026-08-05', url: '#' }
    ]
  },
  {
    id: 'PLOT-B07',
    plotNumber: 'B-07',
    project: 'Sky Cadastral Phase 2',
    area: 1440,
    unit: 'sq.ft',
    length: 48,
    width: 30,
    documentArea: 1500, // Intentional Mismatch (48x30=1440 vs 1500 doc area)
    valuation: 3168000,
    pricePerSqFt: 2200,
    status: 'Available',
    location: 'Sector 2, Plot 7',
    customerName: '',
    customerPhone: '',
    verifiedBy: 'Pending Audit',
    verifiedAt: '',
    verificationStatus: 'Mismatch',
    valuationNotes: 'Requires surveyor boundary re-check. Document area (1500 sq.ft) differs from measured physical dimensions (48x30=1440 sq.ft).',
    documents: [
      { id: 'DOC-110', title: '2D Layout Plan (B-07).pdf', type: '2D Plot Plan PDF', size: '2.0 MB', date: '2026-08-05', url: '#' }
    ]
  },
  {
    id: 'PLOT-C01',
    plotNumber: 'C-01',
    project: 'Sky Cadastral Phase 3',
    area: 3000,
    unit: 'sq.ft',
    length: 60,
    width: 50,
    documentArea: 3000,
    valuation: 7500000,
    pricePerSqFt: 2500,
    status: 'Sold',
    location: 'Lakeview Sector 3',
    customerName: 'Horizon Green Energy Corp',
    customerPhone: '+91 98226 78901',
    verifiedBy: 'Robert H.',
    verifiedAt: '2026-08-11',
    verificationStatus: 'Verified',
    valuationNotes: 'Lake view premium villa plot. Fully paid.',
    documents: [
      { id: 'DOC-111', title: '2D Layout Plan (C-01).pdf', type: '2D Plot Plan PDF', size: '3.8 MB', date: '2026-08-01', url: '#' },
      { id: 'DOC-112', title: 'Title Clear Certificate.pdf', type: 'Ownership Document', size: '2.4 MB', date: '2026-08-10', url: '#' }
    ]
  },
  {
    id: 'PLOT-C02',
    plotNumber: 'C-02',
    project: 'Sky Cadastral Phase 3',
    area: 1600,
    unit: 'sq.ft',
    length: 40,
    width: 40,
    documentArea: 1600,
    valuation: 4000000,
    pricePerSqFt: 2500,
    status: 'Booked',
    location: 'Lakeview Sector 3, Plot 2',
    customerName: 'Rajesh & Sunita Sharma',
    customerPhone: '+91 98222 34567',
    verifiedBy: 'Robert H.',
    verifiedAt: '2026-08-19',
    verificationStatus: 'Verified',
    valuationNotes: 'Booked for duplex residence.',
    documents: [
      { id: 'DOC-113', title: '2D Layout Plan (C-02).pdf', type: '2D Plot Plan PDF', size: '2.3 MB', date: '2026-08-01', url: '#' }
    ]
  },
  {
    id: 'PLOT-C04',
    plotNumber: 'C-04',
    project: 'Sky Cadastral Phase 3',
    area: 1200,
    unit: 'sq.ft',
    length: 40,
    width: 30,
    documentArea: 1200,
    valuation: 3000000,
    pricePerSqFt: 2500,
    status: 'Available',
    location: 'Sector 3, Corner Plot',
    customerName: '',
    customerPhone: '',
    verifiedBy: 'Elena Rostova',
    verifiedAt: '2026-08-25',
    verificationStatus: 'Verified',
    valuationNotes: 'Missing CAD plot plan file - upload required.',
    documents: [] // Intentionally missing documents
  },
  {
    id: 'PLOT-D01',
    plotNumber: 'D-01',
    project: 'Executive Enclave',
    area: 2500,
    unit: 'sq.ft',
    length: 50,
    width: 50,
    documentArea: 2500,
    valuation: 6250000,
    pricePerSqFt: 2500,
    status: 'Sold',
    location: 'Executive Enclave Main Gate',
    customerName: 'State Highway Dept.',
    customerPhone: '+91 98223 45678',
    verifiedBy: 'Robert H.',
    verifiedAt: '2026-08-02',
    verificationStatus: 'Verified',
    valuationNotes: 'Government infrastructure plot.',
    documents: [
      { id: 'DOC-114', title: '2D Layout Plan (D-01).pdf', type: '2D Plot Plan PDF', size: '3.0 MB', date: '2026-08-01', url: '#' }
    ]
  },
  {
    id: 'PLOT-D02',
    plotNumber: 'D-02',
    project: 'Executive Enclave',
    area: 2000,
    unit: 'sq.ft',
    length: 50,
    width: 40,
    documentArea: 2000,
    valuation: 5000000,
    pricePerSqFt: 2500,
    status: 'Available',
    location: 'Executive Enclave, Plot 2',
    customerName: '',
    customerPhone: '',
    verifiedBy: 'Robert H.',
    verifiedAt: '2026-08-20',
    verificationStatus: 'Verified',
    valuationNotes: 'Standard executive plot.',
    documents: [
      { id: 'DOC-115', title: '2D Layout Plan (D-02).pdf', type: '2D Plot Plan PDF', size: '2.4 MB', date: '2026-08-01', url: '#' }
    ]
  },
  {
    id: 'PLOT-D03',
    plotNumber: 'D-03',
    project: 'Executive Enclave',
    area: 1500,
    unit: 'sq.ft',
    length: 50,
    width: 30,
    documentArea: 1500,
    valuation: 3750000,
    pricePerSqFt: 2500,
    status: 'Available',
    location: 'Executive Enclave, Plot 3',
    customerName: '',
    customerPhone: '',
    verifiedBy: 'Elena Rostova',
    verifiedAt: '2026-08-21',
    verificationStatus: 'Verified',
    valuationNotes: 'West-facing plot.',
    documents: [
      { id: 'DOC-116', title: '2D Layout Plan (D-03).pdf', type: '2D Plot Plan PDF', size: '2.1 MB', date: '2026-08-01', url: '#' }
    ]
  },
  {
    id: 'PLOT-D04',
    plotNumber: 'D-04',
    project: 'Executive Enclave',
    area: 1800,
    unit: 'sq.ft',
    length: 60,
    width: 30,
    documentArea: 1800,
    valuation: 4500000,
    pricePerSqFt: 2500,
    status: 'Booked',
    location: 'Executive Enclave, Plot 4',
    customerName: 'Vikramaditya Patil',
    customerPhone: '+91 98225 67890',
    verifiedBy: 'Robert H.',
    verifiedAt: '2026-08-24',
    verificationStatus: 'Verified',
    valuationNotes: 'Booking amount received.',
    documents: [
      { id: 'DOC-117', title: '2D Layout Plan (D-04).pdf', type: '2D Plot Plan PDF', size: '2.5 MB', date: '2026-08-01', url: '#' }
    ]
  },
  {
    id: 'PLOT-E01',
    plotNumber: 'E-01',
    project: 'Green Meadows',
    area: 1200,
    unit: 'sq.ft',
    length: 40,
    width: 30,
    documentArea: 1200,
    valuation: 2100000,
    pricePerSqFt: 1750,
    status: 'Available',
    location: 'Green Meadows, Sector 1',
    customerName: '',
    customerPhone: '',
    verifiedBy: 'Marcus Vance',
    verifiedAt: '2026-08-26',
    verificationStatus: 'Verified',
    valuationNotes: 'Affordable residential plot.',
    documents: [
      { id: 'DOC-118', title: '2D Layout Plan (E-01).pdf', type: '2D Plot Plan PDF', size: '2.0 MB', date: '2026-08-05', url: '#' }
    ]
  },
  {
    id: 'PLOT-E02',
    plotNumber: 'E-02',
    project: 'Green Meadows',
    area: 1200,
    unit: 'sq.ft',
    length: 40,
    width: 30,
    documentArea: 1200,
    valuation: 2100000,
    pricePerSqFt: 1750,
    status: 'Available',
    location: 'Green Meadows, Sector 1',
    customerName: '',
    customerPhone: '',
    verifiedBy: 'Marcus Vance',
    verifiedAt: '2026-08-26',
    verificationStatus: 'Verified',
    valuationNotes: 'Affordable residential plot.',
    documents: [
      { id: 'DOC-119', title: '2D Layout Plan (E-02).pdf', type: '2D Plot Plan PDF', size: '2.0 MB', date: '2026-08-05', url: '#' }
    ]
  },
  {
    id: 'PLOT-E03',
    plotNumber: 'E-03',
    project: 'Green Meadows',
    area: 1500,
    unit: 'sq.ft',
    length: 50,
    width: 30,
    documentArea: 1500,
    valuation: 2625000,
    pricePerSqFt: 1750,
    status: 'Available',
    location: 'Green Meadows, Sector 1',
    customerName: '',
    customerPhone: '',
    verifiedBy: 'Marcus Vance',
    verifiedAt: '2026-08-27',
    verificationStatus: 'Verified',
    valuationNotes: 'Park facing plot.',
    documents: [
      { id: 'DOC-120', title: '2D Layout Plan (E-03).pdf', type: '2D Plot Plan PDF', size: '2.1 MB', date: '2026-08-05', url: '#' }
    ]
  },
  {
    id: 'PLOT-E04',
    plotNumber: 'E-04',
    project: 'Green Meadows',
    area: 1800,
    unit: 'sq.ft',
    length: 60,
    width: 30,
    documentArea: 1800,
    valuation: 3150000,
    pricePerSqFt: 1750,
    status: 'Available',
    location: 'Green Meadows, Sector 1',
    customerName: '',
    customerPhone: '',
    verifiedBy: 'Elena Rostova',
    verifiedAt: '2026-08-27',
    verificationStatus: 'Verified',
    valuationNotes: 'Corner plot.',
    documents: [
      { id: 'DOC-121', title: '2D Layout Plan (E-04).pdf', type: '2D Plot Plan PDF', size: '2.2 MB', date: '2026-08-05', url: '#' }
    ]
  },
  {
    id: 'PLOT-F01',
    plotNumber: 'F-01',
    project: 'Industrial Zone 1',
    area: 5000,
    unit: 'sq.ft',
    length: 100,
    width: 50,
    documentArea: 5000,
    valuation: 12500000,
    pricePerSqFt: 2500,
    status: 'Sold',
    location: 'MIDC Gate 3 Road',
    customerName: 'Pinnacle Infrastructure',
    customerPhone: '+91 98224 56789',
    verifiedBy: 'Robert H.',
    verifiedAt: '2026-07-28',
    verificationStatus: 'Verified',
    valuationNotes: 'Industrial warehouse parcel. Registration complete.',
    documents: [
      { id: 'DOC-122', title: '2D Layout Plan (F-01).pdf', type: '2D Plot Plan PDF', size: '4.5 MB', date: '2026-07-20', url: '#' }
    ]
  },
  {
    id: 'PLOT-F02',
    plotNumber: 'F-02',
    project: 'Industrial Zone 1',
    area: 4000,
    unit: 'sq.ft',
    length: 80,
    width: 50,
    documentArea: 4000,
    valuation: 10000000,
    pricePerSqFt: 2500,
    status: 'Booked',
    location: 'MIDC Gate 3 Road',
    customerName: 'Horizon Green Energy Corp',
    customerPhone: '+91 98226 78901',
    verifiedBy: 'Robert H.',
    verifiedAt: '2026-08-16',
    verificationStatus: 'Verified',
    valuationNotes: 'Booking amount ₹15,00,000 received.',
    documents: [
      { id: 'DOC-123', title: '2D Layout Plan (F-02).pdf', type: '2D Plot Plan PDF', size: '3.9 MB', date: '2026-07-20', url: '#' }
    ]
  }
];

export const INITIAL_BOOKINGS = [
  {
    id: 'BK-2026-01',
    plotId: 'PLOT-A02',
    plotNumber: 'A-02',
    customerName: 'Apex Developments Ltd.',
    customerPhone: '+91 98220 12345',
    customerEmail: 'contact@apexdev.com',
    bookingDate: '2026-08-20',
    totalValue: 3000000,
    bookingAmount: 600000,
    paidAmount: 600000,
    remainingAmount: 2400000,
    status: 'Booked',
    notes: 'Advance booking received via NEFT.'
  },
  {
    id: 'BK-2026-02',
    plotId: 'PLOT-B02',
    plotNumber: 'B-02',
    customerName: 'Pinnacle Infrastructure',
    customerPhone: '+91 98224 56789',
    customerEmail: 'projects@pinnacleinfra.co.in',
    bookingDate: '2026-08-21',
    totalValue: 5280000,
    bookingAmount: 1000000,
    paidAmount: 1000000,
    remainingAmount: 4280000,
    status: 'Booked',
    notes: 'Commercial plot booking.'
  },
  {
    id: 'BK-2026-03',
    plotId: 'PLOT-C02',
    plotNumber: 'C-02',
    customerName: 'Rajesh & Sunita Sharma',
    customerPhone: '+91 98222 34567',
    customerEmail: 'rajesh.sharma@gmail.com',
    bookingDate: '2026-08-19',
    totalValue: 4000000,
    bookingAmount: 500000,
    paidAmount: 500000,
    remainingAmount: 3500000,
    status: 'Booked',
    notes: 'Residential villa plot.'
  },
  {
    id: 'BK-2026-04',
    plotId: 'PLOT-D04',
    plotNumber: 'D-04',
    customerName: 'Vikramaditya Patil',
    customerPhone: '+91 98225 67890',
    customerEmail: 'vikram.patil@outlook.com',
    bookingDate: '2026-08-24',
    totalValue: 4500000,
    bookingAmount: 750000,
    paidAmount: 750000,
    remainingAmount: 3750000,
    status: 'Booked',
    notes: 'Token amount paid.'
  },
  {
    id: 'BK-2026-05',
    plotId: 'PLOT-F02',
    plotNumber: 'F-02',
    customerName: 'Horizon Green Energy Corp',
    customerPhone: '+91 98226 78901',
    customerEmail: 'land@horizongreen.com',
    bookingDate: '2026-08-16',
    totalValue: 10000000,
    bookingAmount: 1500000,
    paidAmount: 1500000,
    remainingAmount: 8500000,
    status: 'Booked',
    notes: 'Industrial plant expansion plot.'
  }
];

export const INITIAL_REVENUE_TRANSACTIONS = [
  {
    id: 'REV-1001',
    date: '2026-08-28',
    time: '11:30 AM',
    plotNumber: 'A-02',
    customerName: 'Apex Developments Ltd.',
    type: 'Booking',
    amount: 600000,
    paymentStatus: 'Realized',
    paymentType: 'NEFT Transfer',
    note: 'Plot A-02 initial booking amount'
  },
  {
    id: 'REV-1002',
    date: '2026-08-28',
    time: '10:15 AM',
    plotNumber: 'A-03',
    customerName: 'Meridian Civic Authority',
    type: 'Sale',
    amount: 1800000,
    paymentStatus: 'Realized',
    paymentType: 'Cheque Clearance',
    note: 'Plot A-03 final settlement on registration'
  },
  {
    id: 'REV-1003',
    date: '2026-08-27',
    time: '04:45 PM',
    plotNumber: 'D-04',
    customerName: 'Vikramaditya Patil',
    type: 'Booking',
    amount: 750000,
    paymentStatus: 'Realized',
    paymentType: 'RTGS',
    note: 'Plot D-04 token booking deposit'
  },
  {
    id: 'REV-1004',
    date: '2026-08-25',
    time: '02:00 PM',
    plotNumber: 'C-01',
    customerName: 'Horizon Green Energy Corp',
    type: 'Sale',
    amount: 7500000,
    paymentStatus: 'Realized',
    paymentType: 'Wire Transfer',
    note: 'Plot C-01 full sale realization'
  },
  {
    id: 'REV-1005',
    date: '2026-08-22',
    time: '12:30 PM',
    plotNumber: 'B-02',
    customerName: 'Pinnacle Infrastructure',
    type: 'Booking',
    amount: 1000000,
    paymentStatus: 'Realized',
    paymentType: 'NEFT',
    note: 'Plot B-02 booking advance'
  },
  {
    id: 'REV-1006',
    date: '2026-08-15',
    time: '11:00 AM',
    plotNumber: 'D-01',
    customerName: 'State Highway Dept.',
    type: 'Sale',
    amount: 6250000,
    paymentStatus: 'Realized',
    paymentType: 'Govt Treasury Draft',
    note: 'Plot D-01 full payment'
  }
];

export const INITIAL_EXPENSES = [
  {
    id: 'EXP-501',
    date: '2026-08-28',
    time: '09:30 AM',
    category: 'Marketing',
    description: 'Site Banners & Billboard Branding',
    amount: 18500,
    note: 'Site branding near Phase 2 entrance'
  },
  {
    id: 'EXP-502',
    date: '2026-08-28',
    time: '01:15 PM',
    category: 'Travel',
    description: 'Fuel for Survey Drone Vehicle & Team',
    amount: 4200,
    note: 'Site inspection travel to Lakeview Sector 3'
  },
  {
    id: 'EXP-503',
    date: '2026-08-27',
    time: '03:30 PM',
    category: 'Documentation',
    description: 'Legal Stamp Duty & Registration Documentation Fee',
    amount: 25000,
    note: 'Sub-registrar filing expenses'
  },
  {
    id: 'EXP-504',
    date: '2026-08-26',
    time: '11:00 AM',
    category: 'Office',
    description: 'High-precision Plotter Paper & Printing Cartridges',
    amount: 8600,
    note: 'CAD blueprint printing supplies'
  },
  {
    id: 'EXP-505',
    date: '2026-08-24',
    time: '05:00 PM',
    category: 'Labour',
    description: 'Boundary Stone Placement Field Labour',
    amount: 15000,
    note: 'Survey team daily wages'
  }
];

export const INITIAL_ACTIVITY_LOGS = [
  { id: 'ACT-1', timestamp: '2026-08-28 11:30 AM', activity: 'Booking Payment Received', plotNumber: 'A-02', amount: '₹6,00,000', icon: 'payments', type: 'revenue' },
  { id: 'ACT-2', timestamp: '2026-08-28 10:15 AM', activity: 'Plot Marked Sold', plotNumber: 'A-03', amount: '₹18,00,000', icon: 'verified', type: 'sale' },
  { id: 'ACT-3', timestamp: '2026-08-28 09:30 AM', activity: 'Expense Recorded', plotNumber: '—', amount: '₹18,500', icon: 'receipt', type: 'expense' },
  { id: 'ACT-4', timestamp: '2026-08-27 04:45 PM', activity: 'Plot Booked', plotNumber: 'D-04', amount: '₹7,50,000', icon: 'bookmark_add', type: 'booking' },
  { id: 'ACT-5', timestamp: '2026-08-25 02:00 PM', activity: 'Valuation Updated', plotNumber: 'B-07', amount: '₹31,68,000', icon: 'edit_square', type: 'update' }
];

export const OFFICIAL_LETTERHEAD_CONFIG = {
  companyName: 'SKY CADASTRAL LAND SERVICES',
  tagline: 'Precision Cadastral Surveying, Valuation & Land Management',
  proprietor: 'Akash Kamble (Lead Land Surveyor & Valuer)',
  address: 'Sky Cadastral Towers, Suite 402, Civil Lines, Pune, Maharashtra - 411001',
  phone: '+91 98220 99887 / +91 020 2554 1122',
  email: 'official@skycadastral.in / akash.kamble@skycadastral.in',
  website: 'www.skycadastral.in',
  regNumber: 'RERA / CAD / MH-2024-884920'
};

export const INITIAL_AREAS = [
  {
    id: 'AREA-001',
    name: 'Sky Cadastral Phase 1',
    ownerName: 'Akash Kamble',
    address: 'Sector 1, Hinjewadi Phase 1, Pune, Maharashtra - 411057',
    description: 'Prime residential layout featuring 40ft wide main approach road, streetlights, and drainage line.'
  },
  {
    id: 'AREA-002',
    name: 'Sky Cadastral Phase 2',
    ownerName: 'Apex Developments Ltd.',
    address: 'Commercial Hub, Sector 2, Baner-Pashan Link Road, Pune - 411045',
    description: 'Commercial & mixed-use zoning with high-density IT corridor proximity.'
  },
  {
    id: 'AREA-003',
    name: 'Sky Cadastral Phase 3',
    ownerName: 'Rajesh & Sunita Sharma',
    address: 'Lakeview Sector 3, Gangapur Road, Nashik - 422001',
    description: 'Scenic waterfront luxury villa plots with clear title verification.'
  },
  {
    id: 'AREA-004',
    name: 'Executive Enclave',
    ownerName: 'Meridian Civic Authority',
    address: 'Civil Lines, Sector 4, Marine Drive, Mumbai - 400001',
    description: 'Premium administrative and high-value residential layout.'
  },
  {
    id: 'AREA-005',
    name: 'Green Meadows',
    ownerName: 'Vikramaditya Patil',
    address: 'Baner Main Road, Near Highway Junction, Pune - 411045',
    description: 'Eco-friendly gated plotting community with central green park.'
  },
  {
    id: 'AREA-006',
    name: 'Industrial Zone 1',
    ownerName: 'Horizon Green Energy Corp',
    address: 'MIDC Gate 3 Road, Chakan Industrial Area, Pune - 410501',
    description: 'Heavy industrial & logistics warehousing parcels with direct highway connectivity.'
  }
];

