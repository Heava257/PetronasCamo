-- Main document table
CREATE TABLE documents (
    document_id INT PRIMARY KEY AUTO_INCREMENT,
    document_title NVARCHAR(255), -- បញ្ជីតិកត្រូវប្រតិបត្តិ (Document title)
    document_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table for document items/entries
CREATE TABLE document_items (
    item_id INT PRIMARY KEY AUTO_INCREMENT,
    document_id INT,
    item_number VARCHAR(20),     -- លេខលំដាប់
    item_type VARCHAR(100),      -- ប្រភេទឯកសារ
    document_number VARCHAR(100), -- លេខឯកសារ
    item_date DATE,              -- កាលបរិច្ឆេទ
    amount DECIMAL(15,2),        -- ចំនួនទឹកប្រាក់
    description NVARCHAR(500),   -- ពណ៌នា
    notes NVARCHAR(500),         -- កំណត់សម្គាល់
    FOREIGN KEY (document_id) REFERENCES documents(document_id) ON DELETE CASCADE
);

-- Table for document approvals/signatures
CREATE TABLE document_approvals (
    approval_id INT PRIMARY KEY AUTO_INCREMENT,
    document_id INT,
    approver_type VARCHAR(50),   -- Type of approver (reviewer, approver, etc.)
    approver_name NVARCHAR(255), -- អ្នកត្រួតពិនិត្យ or អ្នកអនុម័ត
    approval_date DATE,
    signature_image LONGBLOB,    -- To store the signature image
    FOREIGN KEY (document_id) REFERENCES documents(document_id) ON DELETE CASCADE
);

-- Table for document metadata
CREATE TABLE document_metadata (
    metadata_id INT PRIMARY KEY AUTO_INCREMENT,
    document_id INT,
    metadata_key VARCHAR(100),
    metadata_value NVARCHAR(500),
    FOREIGN KEY (document_id) REFERENCES documents(document_id) ON DELETE CASCADE
);




// App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import DocumentList from './components/DocumentList';
import DocumentCreate from './components/DocumentCreate';
import DocumentEdit from './components/DocumentEdit';
import DocumentView from './components/DocumentView';
import DocumentPrint from './components/DocumentPrint';
import Navbar from './components/Navbar';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<DocumentList />} />
            <Route path="/documents/create" element={<DocumentCreate />} />
            <Route path="/documents/edit/:id" element={<DocumentEdit />} />
            <Route path="/documents/view/:id" element={<DocumentView />} />
            <Route path="/documents/print/:id" element={<DocumentPrint />} />
          </Routes>
        </div>
        <ToastContainer position="bottom-right" />
      </div>
    </Router>
  );
}

export default App;

// components/Navbar.js
import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav className="bg-blue-800 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-xl font-bold">ប្រព័ន្ធគ្រប់គ្រងឯកសារ</Link>
        <div>
          <Link to="/" className="mr-4">ឯកសារទាំងអស់</Link>
          <Link to="/documents/create" className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded">
            បន្ថែមឯកសារថ្មី
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

// components/DocumentList.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { format } from 'date-fns';

const API_URL = 'http://localhost:5000/api';

const DocumentList = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const response = await axios.get(`${API_URL}/documents`);
      setDocuments(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast.error('មានបញ្ហាក្នុងការទាញយកឯកសារ');
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('តើអ្នកប្រាកដជាចង់លុបឯកសារនេះមែនទេ?')) {
      try {
        await axios.delete(`${API_URL}/documents/${id}`);
        toast.success('ឯកសារត្រូវបានលុបដោយជោគជ័យ');
        fetchDocuments();
      } catch (error) {
        console.error('Error deleting document:', error);
        toast.error('មានបញ្ហាក្នុងការលុបឯកសារ');
      }
    }
  };

  const handleGenerateSampleData = async () => {
    try {
      await axios.get(`${API_URL}/sample-data`);
      toast.success('ទិន្នន័យគំរូត្រូវបានបង្កើតដោយជោគជ័យ');
      fetchDocuments();
    } catch (error) {
      console.error('Error generating sample data:', error);
      toast.error('មានបញ្ហាក្នុងការបង្កើតទិន្នន័យគំរូ');
    }
  };

  if (loading) {
    return <div className="text-center py-10">កំពុងផ្ទុក...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">បញ្ជីឯកសារទាំងអស់</h1>
        <button 
          onClick={handleGenerateSampleData}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
        >
          បង្កើតទិន្នន័យគំរូ
        </button>
      </div>

      {documents.length === 0 ? (
        <div className="text-center py-10 bg-gray-100 rounded">
          <p>មិនមានឯកសារត្រូវបានរកឃើញទេ</p>
          <Link to="/documents/create" className="text-blue-600 hover:underline mt-2 inline-block">
            បង្កើតឯកសារថ្មី
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border">
            <thead>
              <tr className="bg-gray-200">
                <th className="py-2 px-4 border">លេខរៀង</th>
                <th className="py-2 px-4 border">ចំណងជើង</th>
                <th className="py-2 px-4 border">កាលបរិច្ឆេទ</th>
                <th className="py-2 px-4 border">បង្កើតនៅ</th>
                <th className="py-2 px-4 border">សកម្មភាព</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc, index) => (
                <tr key={doc.document_id} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                  <td className="py-2 px-4 border text-center">{index + 1}</td>
                  <td className="py-2 px-4 border">{doc.document_title}</td>
                  <td className="py-2 px-4 border text-center">
                    {format(new Date(doc.document_date), 'dd-MM-yyyy')}
                  </td>
                  <td className="py-2 px-4 border text-center">
                    {format(new Date(doc.created_at), 'dd-MM-yyyy HH:mm')}
                  </td>
                  <td className="py-2 px-4 border text-center">
                    <div className="flex justify-center space-x-2">
                      <Link 
                        to={`/documents/view/${doc.document_id}`}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-sm"
                      >
                        មើល
                      </Link>
                      <Link 
                        to={`/documents/edit/${doc.document_id}`}
                        className="bg-yellow-600 hover:bg-yellow-700 text-white px-2 py-1 rounded text-sm"
                      >
                        កែប្រែ
                      </Link>
                      <Link 
                        to={`/documents/print/${doc.document_id}`}
                        className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-sm"
                      >
                        បោះពុម្ព
                      </Link>
                      <button 
                        onClick={() => handleDelete(doc.document_id)}
                        className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-sm"
                      >
                        លុប
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default DocumentList;

// components/DocumentForm.js
import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

const DocumentForm = ({ initialData, onSubmit, isLoading }) => {
  const [formData, setFormData] = useState({
    document_title: initialData?.document?.document_title || 'បញ្ជីតិកត្រូវប្រតិបត្តិ',
    document_date: initialData?.document?.document_date ? new Date(initialData.document.document_date) : new Date(),
    items: initialData?.items || [
      { item_number: '1', item_type: '', document_number: '', item_date: new Date(), amount: '', description: '', notes: '' }
    ],
    approvals: initialData?.approvals || [
      { approver_type: 'reviewer', approver_name: 'ត្រួតពិនិត្យ', approval_date: new Date() },
      { approver_type: 'approver', approver_name: 'អនុម័តដោយ', approval_date: new Date() }
    ]
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleDateChange = (date) => {
    setFormData({ ...formData, document_date: date });
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...formData.items];
    updatedItems[index][field] = value;
    setFormData({ ...formData, items: updatedItems });
  };

  const handleItemDateChange = (index, date) => {
    const updatedItems = [...formData.items];
    updatedItems[index].item_date = date;
    setFormData({ ...formData, items: updatedItems });
  };

  const handleApprovalChange = (index, field, value) => {
    const updatedApprovals = [...formData.approvals];
    updatedApprovals[index][field] = value;
    setFormData({ ...formData, approvals: updatedApprovals });
  };

  const handleApprovalDateChange = (index, date) => {
    const updatedApprovals = [...formData.approvals];
    updatedApprovals[index].approval_date = date;
    setFormData({ ...formData, approvals: updatedApprovals });
  };

  const addItem = () => {
    const newItem = {
      item_number: (formData.items.length + 1).toString(),
      item_type: '',
      document_number: '',
      item_date: new Date(),
      amount: '',
      description: '',
      notes: ''
    };
    setFormData({ ...formData, items: [...formData.items, newItem] });
  };

  const removeItem = (index) => {
    const updatedItems = formData.items.filter((_, i) => i !== index);
    // Renumber items
    updatedItems.forEach((item, i) => {
      item.item_number = (i + 1).toString();
    });
    setFormData({ ...formData, items: updatedItems });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white rounded shadow p-6">
        <h2 className="text-xl font-bold mb-4">ព័ត៌មានឯកសារ</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block mb-1">ចំណងជើងឯកសារ</label>
            <input
              type="text"
              name="document_title"
              value={formData.document_title}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>
          
          <div>
            <label className="block mb-1">កាលបរិច្ឆេទ</label>
            <DatePicker
              selected={formData.document_date}
              onChange={handleDateChange}
              className="w-full border rounded px-3 py-2"
              dateFormat="dd/MM/yyyy"
              required
            />
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">ពត៌មានលម្អិត</h2>
          <button
            type="button"
            onClick={addItem}
            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded"
          >
            បន្ថែមជួរ
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full border">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-2 px-3 border">ល.រ</th>
                <th className="py-2 px-3 border">ប្រភេទឯកសារ</th>
                <th className="py-2 px-3 border">លេខឯកសារ</th>
                <th className="py-2 px-3 border">កាលបរិច្ឆេទ</th>
                <th className="py-2 px-3 border">ចំនួនទឹកប្រាក់</th>
                <th className="py-2 px-3 border">ពណ៌នា</th>
                <th className="py-2 px-3 border">សកម្មភាព</th>
              </tr>
            </thead>
            <tbody>
              {formData.items.map((item, index) => (
                <tr key={index}>
                  <td className="py-2 px-3 border text-center">{item.item_number}</td>
                  <td className="py-2 px-3 border">
                    <input
                      type="text"
                      value={item.item_type}
                      onChange={(e) => handleItemChange(index, 'item_type', e.target.value)}
                      className="w-full border rounded px-2 py-1"
                    />
                  </td>
                  <td className="py-2 px-3 border">
                    <input
                      type="text"
                      value={item.document_number}
                      onChange={(e) => handleItemChange(index, 'document_number', e.target.value)}
                      className="w-full border rounded px-2 py-1"
                    />
                  </td>
                  <td className="py-2 px-3 border">
                    <DatePicker
                      selected={item.item_date instanceof Date ? item.item_date : new Date(item.item_date)}
                      onChange={(date) => handleItemDateChange(index, date)}
                      className="w-full border rounded px-2 py-1"
                      dateFormat="dd/MM/yyyy"
                    />
                  </td>
                  <td className="py-2 px-3 border">
                    <input
                      type="number"
                      value={item.amount}
                      onChange={(e) => handleItemChange(index, 'amount', e.target.value)}
                      className="w-full border rounded px-2 py-1"
                    />
                  </td>
                  <td className="py-2 px-3 border">
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                      className="w-full border rounded px-2 py-1"
                    />
                  </td>
                  <td className="py-2 px-3 border text-center">
                    {formData.items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-sm"
                      >
                        លុប
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="bg-white rounded shadow p-6">
        <h2 className="text-xl font-bold mb-4">ការអនុម័ត</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {formData.approvals.map((approval, index) => (
            <div key={index} className="border p-4 rounded">
              <h3 className="font-bold mb-2">
                {approval.approver_type === 'reviewer' ? 'អ្នកត្រួតពិនិត្យ' : 'អ្នកអនុម័ត'}
              </h3>
              
              <div className="mb-3">
                <label className="block mb-1">ឈ្មោះ</label>
                <input
                  type="text"
                  value={approval.approver_name}
                  onChange={(e) => handleApprovalChange(index, 'approver_name', e.target.value)}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              
              <div>
                <label className="block mb-1">កាលបរិច្ឆេទ</label>
                <DatePicker
                  selected={approval.approval_date instanceof Date ? approval.approval_date : new Date(approval.approval_

















                  // server.js - Main backend file
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');

const app = express();
const port = 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Configure multer for file uploads (signatures)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Database connection
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'password',
  database: 'document_management'
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Test database connection
app.get('/api/test', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    connection.release();
    res.json({ status: 'Connected to database successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// INSERT SAMPLE DATA
app.get('/api/sample-data', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    
    // Insert sample document
    await connection.query(`
      INSERT INTO documents (document_title, document_date) VALUES 
      ('បញ្ជីតិកត្រូវប្រតិបត្តិ', '2025-03-02'),
      ('បញ្ជីចំណាយប្រចាំខែ', '2025-03-01')
    `);
    
    // Get the document IDs
    const [documents] = await connection.query('SELECT document_id FROM documents LIMIT 2');
    const doc1Id = documents[0].document_id;
    const doc2Id = documents[1].document_id;
    
    // Insert document items
    await connection.query(`
      INSERT INTO document_items (document_id, item_number, item_type, document_number, item_date, amount, description) VALUES 
      (?, '1', 'សាច់ប្រាក់', 'L', '2025-03-02', 1500000, '(ប្រាក់ដើមខែកុម្ភៈ)'),
      (?, '2', 'សាច់ប្រាក់បើក', 'L', '2025-03-02', 2000000, '(ប្រាក់ដើមខែកុម្ភៈ)'),
      (?, '3', 'វិក្ក័យ', 'L', '2025-03-02', 500000, '(ទិញសម្ភារៈផ្សេងៗ)'),
      (?, '1', 'បង្កាន់ដៃទទួលប្រាក់', 'R001', '2025-03-01', 250000, 'ទិញសម្ភារការិយាល័យ'),
      (?, '2', 'វិក្ក័យបត្រ', 'INV2203', '2025-03-01', 175000, 'ទិញទឹកសុទ្ធ')
    `, [doc1Id, doc1Id, doc1Id, doc2Id, doc2Id]);
    
    // Insert approvals
    await connection.query(`
      INSERT INTO document_approvals (document_id, approver_type, approver_name, approval_date) VALUES 
      (?, 'reviewer', 'ត្រួតពិនិត្យ', '2025-03-02'),
      (?, 'approver', 'អនុម័តដោយ', '2025-03-02'),
      (?, 'reviewer', 'ត្រួតពិនិត្យ', '2025-03-01'),
      (?, 'approver', 'អនុម័តដោយ', '2025-03-01')
    `, [doc1Id, doc1Id, doc2Id, doc2Id]);
    
    connection.release();
    res.json({ status: 'Sample data inserted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET all documents
app.get('/api/documents', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM documents ORDER BY document_date DESC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET a single document with its items and approvals
app.get('/api/documents/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get document details
    const [document] = await pool.query('SELECT * FROM documents WHERE document_id = ?', [id]);
    
    // Get document items
    const [items] = await pool.query('SELECT * FROM document_items WHERE document_id = ? ORDER BY item_number', [id]);
    
    // Get approvals
    const [approvals] = await pool.query('SELECT * FROM document_approvals WHERE document_id = ?', [id]);
    
    // Get metadata
    const [metadata] = await pool.query('SELECT * FROM document_metadata WHERE document_id = ?', [id]);
    
    if (document.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    res.json({
      document: document[0],
      items,
      approvals,
      metadata
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// CREATE a new document
app.post('/api/documents', async (req, res) => {
  try {
    const { document_title, document_date, items, approvals, metadata } = req.body;
    
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    
    try {
      // Insert document
      const [docResult] = await connection.query(
        'INSERT INTO documents (document_title, document_date) VALUES (?, ?)',
        [document_title, document_date]
      );
      
      const documentId = docResult.insertId;
      
      // Insert items
      if (items && items.length) {
        for (const item of items) {
          await connection.query(
            `INSERT INTO document_items 
            (document_id, item_number, item_type, document_number, item_date, amount, description, notes) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              documentId, 
              item.item_number, 
              item.item_type, 
              item.document_number, 
              item.item_date, 
              item.amount, 
              item.description, 
              item.notes
            ]
          );
        }
      }
      
      // Insert approvals
      if (approvals && approvals.length) {
        for (const approval of approvals) {
          await connection.query(
            `INSERT INTO document_approvals 
            (document_id, approver_type, approver_name, approval_date) 
            VALUES (?, ?, ?, ?)`,
            [
              documentId, 
              approval.approver_type, 
              approval.approver_name, 
              approval.approval_date
            ]
          );
        }
      }
      
      // Insert metadata
      if (metadata && metadata.length) {
        for (const meta of metadata) {
          await connection.query(
            'INSERT INTO document_metadata (document_id, metadata_key, metadata_value) VALUES (?, ?, ?)',
            [documentId, meta.key, meta.value]
          );
        }
      }
      
      await connection.commit();
      connection.release();
      
      res.status(201).json({ 
        message: 'Document created successfully', 
        document_id: documentId 
      });
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// UPDATE a document
app.put('/api/documents/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { document_title, document_date, items, approvals, metadata } = req.body;
    
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    
    try {
      // Update document
      await connection.query(
        'UPDATE documents SET document_title = ?, document_date = ? WHERE document_id = ?',
        [document_title, document_date, id]
      );
      
      // Delete existing items and insert new ones
      await connection.query('DELETE FROM document_items WHERE document_id = ?', [id]);
      
      if (items && items.length) {
        for (const item of items) {
          await connection.query(
            `INSERT INTO document_items 
            (document_id, item_number, item_type, document_number, item_date, amount, description, notes) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              id, 
              item.item_number, 
              item.item_type, 
              item.document_number, 
              item.item_date, 
              item.amount, 
              item.description, 
              item.notes
            ]
          );
        }
      }
      
      // Delete existing approvals and insert new ones
      await connection.query('DELETE FROM document_approvals WHERE document_id = ?', [id]);
      
      if (approvals && approvals.length) {
        for (const approval of approvals) {
          await connection.query(
            `INSERT INTO document_approvals 
            (document_id, approver_type, approver_name, approval_date) 
            VALUES (?, ?, ?, ?)`,
            [
              id, 
              approval.approver_type, 
              approval.approver_name, 
              approval.approval_date
            ]
          );
        }
      }
      
      // Update metadata
      await connection.query('DELETE FROM document_metadata WHERE document_id = ?', [id]);
      
      if (metadata && metadata.length) {
        for (const meta of metadata) {
          await connection.query(
            'INSERT INTO document_metadata (document_id, metadata_key, metadata_value) VALUES (?, ?, ?)',
            [id, meta.key, meta.value]
          );
        }
      }
      
      await connection.commit();
      connection.release();
      
      res.json({ message: 'Document updated successfully' });
    } catch (error) {
      await connection.rollback();
      connection.release();
      throw error;
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE a document
app.delete('/api/documents/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Foreign key constraints will handle deletion of related records
    await pool.query('DELETE FROM documents WHERE document_id = ?', [id]);
    
    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Upload signature image
app.post('/api/upload-signature', upload.single('signature'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const filePath = req.file.path;
    res.json({ 
      message: 'File uploaded successfully',
      filePath
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
});