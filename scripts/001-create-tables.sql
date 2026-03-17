-- Create incidents table for accidents/injuries
CREATE TABLE IF NOT EXISTS incidents (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    organization VARCHAR(255) NOT NULL,
    incident_type VARCHAR(100) NOT NULL,
    description TEXT,
    severity VARCHAR(50) NOT NULL,
    location VARCHAR(255),
    injuries INTEGER DEFAULT 0,
    fatalities INTEGER DEFAULT 0,
    economic_loss DECIMAL(15, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create korgau_cards table for safety observations
CREATE TABLE IF NOT EXISTS korgau_cards (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    organization VARCHAR(255) NOT NULL,
    observation_type VARCHAR(100) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT,
    location VARCHAR(255),
    corrective_action TEXT,
    status VARCHAR(50) DEFAULT 'open',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_incidents_date ON incidents(date);
CREATE INDEX IF NOT EXISTS idx_incidents_organization ON incidents(organization);
CREATE INDEX IF NOT EXISTS idx_incidents_type ON incidents(incident_type);
CREATE INDEX IF NOT EXISTS idx_korgau_date ON korgau_cards(date);
CREATE INDEX IF NOT EXISTS idx_korgau_organization ON korgau_cards(organization);
CREATE INDEX IF NOT EXISTS idx_korgau_type ON korgau_cards(observation_type);
