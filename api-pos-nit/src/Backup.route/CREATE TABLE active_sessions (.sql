CREATE TABLE active_sessions (
  user_id INT PRIMARY KEY,
  token TEXT NOT NULL,
  is_pending BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);




ALTER TABLE customer
ADD COLUMN id_card_number VARCHAR(20),
ADD COLUMN id_card_expiry DATE,
ADD COLUMN spouse_name VARCHAR(100),
ADD COLUMN guarantor_name VARCHAR(100);
