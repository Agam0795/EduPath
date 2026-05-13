import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import { librariesAPI } from '../../services/api';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiMapPin, FiUpload, FiDownload } from 'react-icons/fi';
import Sidebar from '../Student/Sidebar';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const ClickHandler = ({ onMapClick }) => {
  useMapEvents({ click: (e) => onMapClick(e.latlng) });
  return null;
};

const EXCEL_HEADERS = {
  name: ['Name', 'Library Name', 'Library', 'Title'],
  type: ['Type', 'Category'],
  address: ['Address', 'Location Address', 'Street Address'],
  lat: ['Latitude', 'Lat', 'latitude', 'lat'],
  lng: ['Longitude', 'Lng', 'Long', 'longitude', 'lng'],
  openingHours: ['Opening Hours', 'Hours', 'Open Hours'],
  contactNumber: ['Contact Number', 'Phone', 'Contact'],
  website: ['Website', 'Web Site', 'URL'],
  image: ['Image URL', 'Image', 'Image Link'],
  rating: ['Rating', 'Stars'],
  totalBooks: ['Total Books', 'Books', 'Book Count', 'Inventory'],
};

const getExcelValue = (row, keys, fallback = '') => {
  for (const key of keys) {
    const value = row[key];
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return value;
    }
  }
  return fallback;
};

const normalizeExcelRow = (row) => {
  const lat = Number(getExcelValue(row, EXCEL_HEADERS.lat, ''));
  const lng = Number(getExcelValue(row, EXCEL_HEADERS.lng, ''));
  const name = String(getExcelValue(row, EXCEL_HEADERS.name, '')).trim();
  const address = String(getExcelValue(row, EXCEL_HEADERS.address, '')).trim();

  if (!name || !address || Number.isNaN(lat) || Number.isNaN(lng)) {
    return null;
  }

  return {
    name,
    type: String(getExcelValue(row, EXCEL_HEADERS.type, 'library')).toLowerCase() === 'bookstore' ? 'bookstore' : 'library',
    address,
    location: { lat, lng },
    openingHours: String(getExcelValue(row, EXCEL_HEADERS.openingHours, '9:00 AM - 6:00 PM')),
    contactNumber: String(getExcelValue(row, EXCEL_HEADERS.contactNumber, '')),
    website: String(getExcelValue(row, EXCEL_HEADERS.website, '')),
    image: String(getExcelValue(row, EXCEL_HEADERS.image, '')),
    rating: Number(getExcelValue(row, EXCEL_HEADERS.rating, 4.0)),
    totalBooks: Number(getExcelValue(row, EXCEL_HEADERS.totalBooks, 0)),
  };
};

const Modal = ({ title, onClose, children }) => (
  <div className="modal-overlay" onClick={onClose}>
    <div className="modal-box wide-modal" onClick={e => e.stopPropagation()}>
      <div className="modal-header">
        <h3>{title}</h3>
        <button onClick={onClose} className="modal-close"><FiX /></button>
      </div>
      <div className="modal-body">{children}</div>
    </div>
  </div>
);

const LibraryManagement = () => {
  const [libraries, setLibraries] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pickingLocation, setPickingLocation] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    name: '', type: 'library', address: '',
    location: { lat: 28.6139, lng: 77.2090 },
    openingHours: '9:00 AM - 6:00 PM',
    contactNumber: '', website: '', image: '', rating: 4.0, totalBooks: 0
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setLoc = (lat, lng) => setForm(f => ({ ...f, location: { lat, lng } }));

  const fetchLibraries = async () => {
    try {
      const res = await librariesAPI.getAll();
      setLibraries(res.data.libraries || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchLibraries(); }, []);

  const openAdd = () => {
    setEditing(null);
    setForm({ name: '', type: 'library', address: '', location: { lat: 28.6139, lng: 77.2090 }, openingHours: '9:00 AM - 6:00 PM', contactNumber: '', website: '', image: '', rating: 4.0, totalBooks: 0 });
    setShowModal(true);
  };

  const openEdit = (lib) => {
    setEditing(lib);
    setForm({ name: lib.name, type: lib.type, address: lib.address, location: lib.location, openingHours: lib.openingHours, contactNumber: lib.contactNumber, website: lib.website || '', image: lib.image || '', rating: lib.rating, totalBooks: lib.totalBooks });
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      if (editing) await librariesAPI.update(editing._id, form);
      else await librariesAPI.create(form);
      setShowModal(false);
      fetchLibraries();
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving library');
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"?`)) return;
    await librariesAPI.delete(id);
    fetchLibraries();
  };

  const exportLibraries = () => {
    const rows = libraries.map(lib => ({
      Name: lib.name || '',
      Type: lib.type || 'library',
      Address: lib.address || '',
      Latitude: lib.location?.lat ?? '',
      Longitude: lib.location?.lng ?? '',
      'Opening Hours': lib.openingHours || '',
      'Contact Number': lib.contactNumber || '',
      Website: lib.website || '',
      'Image URL': lib.image || '',
      Rating: lib.rating ?? '',
      'Total Books': lib.totalBooks ?? 0,
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Libraries');
    XLSX.writeFile(workbook, 'library-management-export.xlsx');
  };

  const downloadTemplate = () => {
    const templateRows = [
      {
        Name: 'Delhi University Central Library',
        Type: 'library',
        Address: 'University Road, Delhi',
        Latitude: 28.688,
        Longitude: 77.208,
        'Opening Hours': '9:00 AM - 8:00 PM',
        'Contact Number': '+91-11-00000000',
        Website: 'https://example.com',
        'Image URL': 'https://example.com/library.jpg',
        Rating: 4.8,
        'Total Books': 150000,
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Library Template');
    XLSX.writeFile(workbook, 'library-management-template.xlsx');
  };

  const openImportDialog = () => {
    fileInputRef.current?.click();
  };

  const handleImportFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const worksheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[worksheetName];
      const rows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

      if (!rows.length) {
        alert('No rows found in the uploaded spreadsheet.');
        return;
      }

      let importedCount = 0;
      let skippedCount = 0;

      for (const row of rows) {
        const payload = normalizeExcelRow(row);
        if (!payload) {
          skippedCount += 1;
          continue;
        }

        try {
          await librariesAPI.create(payload);
          importedCount += 1;
        } catch (err) {
          skippedCount += 1;
        }
      }

      await fetchLibraries();
      alert(`Imported ${importedCount} libraries${skippedCount ? `, skipped ${skippedCount}` : ''}.`);
    } catch (err) {
      alert(err.message || 'Failed to import spreadsheet');
    } finally {
      setImporting(false);
      event.target.value = '';
    }
  };

  const handleMapClick = (latlng) => {
    if (pickingLocation) {
      setLoc(latlng.lat, latlng.lng);
      setPickingLocation(false);
    }
  };

  return (
    <div className="dashboard-layout">
      <Sidebar role="admin" />
      <div className="main-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">Library Management</h1>
            <p className="page-subtitle">{libraries.length} locations in system</p>
          </div>
          <button className="btn btn-primary" onClick={openAdd} id="add-library-btn">
            <FiPlus size={16} /> Add Library
          </button>
          <button className="btn btn-outline" onClick={openImportDialog} disabled={importing} id="import-libraries-btn" style={{ marginLeft: '0.75rem' }}>
            <FiUpload size={16} /> {importing ? 'Importing...' : 'Import Excel'}
          </button>
          <button className="btn btn-outline" onClick={exportLibraries} id="export-libraries-btn" style={{ marginLeft: '0.75rem' }}>
            <FiDownload size={16} /> Export Excel
          </button>
          <button className="btn btn-outline" onClick={downloadTemplate} id="template-libraries-btn" style={{ marginLeft: '0.75rem' }}>
            <FiDownload size={16} /> Download Template
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleImportFile}
            style={{ display: 'none' }}
          />
        </div>

        {/* Mini Map Overview */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header">
            <h2 className="card-title">Library Locations Overview</h2>
          </div>
          <div style={{ height: '300px', borderRadius: '0 0 12px 12px', overflow: 'hidden' }}>
            <MapContainer center={[28.6139, 77.2090]} zoom={11} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                attribution='&copy; OpenStreetMap contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {libraries.map(lib => (
                <Marker key={lib._id} position={[lib.location.lat, lib.location.lng]}>
                  <Popup>
                    <div className="map-popup">
                      <strong>{lib.name}</strong>
                      <p>{lib.type} · ⭐ {lib.rating}</p>
                      <small>{lib.address}</small>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </div>

        {/* Libraries Table */}
        <div className="card">
          <div className="table-responsive">
            {loading ? (
              <div className="loading-state"><div className="spinner-large"></div></div>
            ) : (
              <table className="marks-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Address</th>
                    <th>Hours</th>
                    <th>Rating</th>
                    <th>Books</th>
                    <th>GPS</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {libraries.map(lib => (
                    <tr key={lib._id}>
                      <td><strong>{lib.name}</strong></td>
                      <td>
                        <span className={`type-badge type-${lib.type}`}>
                          {lib.type === 'library' ? '📚 Library' : '🏪 Bookstore'}
                        </span>
                      </td>
                      <td style={{ maxWidth: '200px', fontSize: '0.8rem' }}>{lib.address}</td>
                      <td style={{ fontSize: '0.8rem' }}>⏰ {lib.openingHours}</td>
                      <td>⭐ {lib.rating}</td>
                      <td>{lib.books?.length || 0}</td>
                      <td style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                        {lib.location.lat.toFixed(4)}, {lib.location.lng.toFixed(4)}
                      </td>
                      <td>
                        <div className="action-btns">
                          <button className="icon-btn edit-btn" onClick={() => openEdit(lib)} id={`edit-lib-${lib._id}`}><FiEdit2 size={14} /></button>
                          <button className="icon-btn delete-btn" onClick={() => handleDelete(lib._id, lib.name)} id={`delete-lib-${lib._id}`}><FiTrash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {showModal && (
          <Modal title={editing ? 'Edit Library' : 'Add Library / Bookstore'} onClose={() => setShowModal(false)}>
            <div className="form-grid">
              <div className="form-group form-full">
                <label>Library Name *</label>
                <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="University Central Library" />
              </div>
              <div className="form-group">
                <label>Type</label>
                <select value={form.type} onChange={e => set('type', e.target.value)}>
                  <option value="library">Library</option>
                  <option value="bookstore">Bookstore</option>
                </select>
              </div>
              <div className="form-group">
                <label>Rating</label>
                <input type="number" min="0" max="5" step="0.1" value={form.rating} onChange={e => set('rating', Number(e.target.value))} />
              </div>
              <div className="form-group form-full">
                <label>Address *</label>
                <input value={form.address} onChange={e => set('address', e.target.value)} placeholder="Full address" />
              </div>
              <div className="form-group">
                <label>Opening Hours</label>
                <input value={form.openingHours} onChange={e => set('openingHours', e.target.value)} placeholder="9:00 AM - 6:00 PM" />
              </div>
              <div className="form-group">
                <label>Contact Number</label>
                <input value={form.contactNumber} onChange={e => set('contactNumber', e.target.value)} placeholder="+91-11-..." />
              </div>
              <div className="form-group">
                <label>Total Books</label>
                <input type="number" value={form.totalBooks} onChange={e => set('totalBooks', Number(e.target.value))} />
              </div>
              <div className="form-group">
                <label>Website</label>
                <input value={form.website} onChange={e => set('website', e.target.value)} placeholder="https://..." />
              </div>
              <div className="form-group">
                <label>Image URL</label>
                <input value={form.image} onChange={e => set('image', e.target.value)} placeholder="https://.../library.jpg" />
              </div>

              {/* GPS Picker */}
              <div className="form-group form-full">
                <label>GPS Coordinates</label>
                <div className="gps-row">
                  <input type="number" step="0.0001" value={form.location.lat} onChange={e => setLoc(Number(e.target.value), form.location.lng)} placeholder="Latitude" />
                  <input type="number" step="0.0001" value={form.location.lng} onChange={e => setLoc(form.location.lat, Number(e.target.value))} placeholder="Longitude" />
                  <button
                    type="button"
                    className={`btn ${pickingLocation ? 'btn-primary' : 'btn-outline'} btn-sm`}
                    onClick={() => setPickingLocation(!pickingLocation)}
                    id="pick-location-btn"
                  >
                    <FiMapPin size={14} /> {pickingLocation ? 'Click map...' : 'Pick on Map'}
                  </button>
                </div>
              </div>

              {/* Map for picking location */}
              <div className="form-group form-full">
                <div style={{ height: '220px', borderRadius: '8px', overflow: 'hidden', border: '2px solid', borderColor: pickingLocation ? '#2563EB' : '#E5E7EB' }}>
                  <MapContainer center={[form.location.lat, form.location.lng]} zoom={11} style={{ height: '100%', width: '100%' }}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <ClickHandler onMapClick={handleMapClick} />
                    <Marker position={[form.location.lat, form.location.lng]}>
                      <Popup>{form.name || 'New location'}</Popup>
                    </Marker>
                  </MapContainer>
                </div>
                {pickingLocation && <p style={{ color: '#2563EB', fontSize: '0.85rem', marginTop: '0.5rem' }}>🖱️ Click anywhere on the map to set the location</p>}
              </div>

              <div className="form-actions form-full">
                <button className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleSave} id="save-library-btn">
                  {editing ? 'Update Library' : 'Add Library'}
                </button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </div>
  );
};

export default LibraryManagement;
