-- Sky Cadastral Master Database Schema for Neon PostgreSQL

CREATE TABLE IF NOT EXISTS projects (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    owner_name VARCHAR(255),
    address TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS layouts (
    id VARCHAR(64) PRIMARY KEY,
    project_id VARCHAR(64) REFERENCES projects(id) ON DELETE SET NULL,
    project_name VARCHAR(255),
    name VARCHAR(255) NOT NULL,
    status VARCHAR(64) DEFAULT 'Draft', -- 'Uploaded', 'Processing', 'Needs Verification', 'Verified', 'Published'
    original_pdf_url TEXT,
    original_pdf_name VARCHAR(255),
    file_size VARCHAR(64),
    bounding_width NUMERIC(10, 2) DEFAULT 800,
    bounding_height NUMERIC(10, 2) DEFAULT 600,
    extracted_plots_count INT DEFAULT 0,
    uploaded_at VARCHAR(64),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS plots (
    id VARCHAR(64) PRIMARY KEY,
    plot_number VARCHAR(64) NOT NULL,
    layout_id VARCHAR(64) REFERENCES layouts(id) ON DELETE CASCADE,
    project VARCHAR(255),
    area NUMERIC(12, 2) NOT NULL,
    unit VARCHAR(32) DEFAULT 'sq.ft',
    length NUMERIC(10, 2),
    width NUMERIC(10, 2),
    document_area NUMERIC(12, 2),
    facing VARCHAR(64),
    facing_road_width NUMERIC(10, 2),
    polygon_geometry JSONB NOT NULL,
    valuation NUMERIC(14, 2) NOT NULL,
    price_per_sqft NUMERIC(12, 2) NOT NULL,
    status VARCHAR(32) DEFAULT 'Available', -- 'Available', 'Booked', 'Sold', 'Blocked'
    location TEXT,
    customer_name VARCHAR(255),
    customer_phone VARCHAR(64),
    verified_by VARCHAR(255),
    verified_at VARCHAR(64),
    verification_status VARCHAR(64) DEFAULT 'Needs Verification', -- 'Verified', 'Needs Verification', 'Mismatch'
    valuation_notes TEXT,
    documents JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bookings (
    id VARCHAR(64) PRIMARY KEY,
    plot_id VARCHAR(64) REFERENCES plots(id) ON DELETE CASCADE,
    plot_number VARCHAR(64) NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(64),
    customer_email VARCHAR(255),
    booking_date VARCHAR(64),
    total_value NUMERIC(14, 2),
    booking_amount NUMERIC(14, 2),
    paid_amount NUMERIC(14, 2),
    remaining_amount NUMERIC(14, 2),
    status VARCHAR(32) DEFAULT 'Booked',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS revenue_transactions (
    id VARCHAR(64) PRIMARY KEY,
    date VARCHAR(64),
    time VARCHAR(64),
    plot_number VARCHAR(64),
    customer_name VARCHAR(255),
    type VARCHAR(64),
    amount NUMERIC(14, 2),
    payment_status VARCHAR(64),
    payment_type VARCHAR(64),
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS expenses (
    id VARCHAR(64) PRIMARY KEY,
    date VARCHAR(64),
    time VARCHAR(64),
    category VARCHAR(128),
    description TEXT,
    amount NUMERIC(14, 2),
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS plot_audit_logs (
    id SERIAL PRIMARY KEY,
    plot_id VARCHAR(64) REFERENCES plots(id) ON DELETE CASCADE,
    plot_number VARCHAR(64),
    field_changed VARCHAR(128) NOT NULL,
    old_value TEXT,
    new_value TEXT,
    changed_by VARCHAR(255) NOT NULL,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
