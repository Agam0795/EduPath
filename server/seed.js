const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Student = require('./models/Student');
const Marks = require('./models/Marks');
const Book = require('./models/Book');
const Library = require('./models/Library');

async function seed() {
  try {
    // Clear existing data
    await Promise.all([Student.deleteMany({}), Marks.deleteMany({}), Book.deleteMany({}), Library.deleteMany({})]);

    // ── Admin ─────────────────────────────────────
    const admin = await Student.create({
      studentId: 'ADMIN001',
      name: 'Admin User',
      email: 'admin@edupath.com',
      password: 'admin123',
      role: 'admin',
      semester: 0,
      branch: 'Administration',
      location: { lat: 28.6139, lng: 77.2090 }
    });

    // ── Students ──────────────────────────────────
    const student1 = await Student.create({
      studentId: 'STU2303179',
      name: 'Agam Sharma',
      email: 'agam@edupath.com',
      password: 'student123',
      role: 'student',
      semester: 6,
      branch: 'B.Sc. Mathematics (Honours)',
      location: { lat: 28.6129, lng: 77.2290 }
    });

    const student2 = await Student.create({
      studentId: 'STU2303180',
      name: 'Priya Singh',
      email: 'priya@edupath.com',
      password: 'student123',
      role: 'student',
      semester: 6,
      branch: 'B.Sc. Mathematics (Honours)',
      location: { lat: 28.6200, lng: 77.2150 }
    });

    const student3 = await Student.create({
      studentId: 'STU2303181',
      name: 'Rahul Verma',
      email: 'rahul@edupath.com',
      password: 'student123',
      role: 'student',
      semester: 4,
      branch: 'B.Sc. Computer Science',
      location: { lat: 28.6050, lng: 77.2300 }
    });

    // ── Libraries ─────────────────────────────────
    const lib1 = await Library.create({
      name: 'Delhi University Central Library',
      type: 'library',
      address: 'University Road, Delhi University North Campus, Delhi, 110007',
      location: { lat: 28.6880, lng: 77.2080 },
      openingHours: '9:00 AM - 8:00 PM',
      contactNumber: '+91-11-27667011',
      rating: 4.8,
      totalBooks: 150000
    });

    const lib2 = await Library.create({
      name: 'Connaught Place Book Market',
      type: 'bookstore',
      address: 'Connaught Place, New Delhi, 110001',
      location: { lat: 28.6304, lng: 77.2177 },
      openingHours: '10:00 AM - 9:00 PM',
      contactNumber: '+91-11-23412345',
      rating: 4.5,
      totalBooks: 5000
    });

    const lib3 = await Library.create({
      name: 'Jawaharlal Nehru University Library',
      type: 'library',
      address: 'New Mehrauli Road, New Delhi, 110067',
      location: { lat: 28.5400, lng: 77.1670 },
      openingHours: '8:00 AM - 10:00 PM',
      contactNumber: '+91-11-26741557',
      rating: 4.9,
      totalBooks: 500000
    });

    const lib4 = await Library.create({
      name: 'Daryaganj Book Market',
      type: 'bookstore',
      address: 'Daryaganj, New Delhi, 110002',
      location: { lat: 28.6484, lng: 77.2406 },
      openingHours: '9:00 AM - 7:00 PM',
      contactNumber: '+91-11-23259878',
      rating: 4.3,
      totalBooks: 20000
    });

    const lib5 = await Library.create({
      name: 'IIT Delhi Central Library',
      type: 'library',
      address: 'Indian Institute of Technology, Hauz Khas, New Delhi, 110016',
      location: { lat: 28.5459, lng: 77.1926 },
      openingHours: '8:00 AM - 11:00 PM',
      contactNumber: '+91-11-26591798',
      rating: 4.7,
      totalBooks: 300000
    });

    // ── Books ─────────────────────────────────────
    const book1 = await Book.create({
      title: 'Linear Algebra Done Right',
      author: 'Sheldon Axler',
      subject: 'Linear Algebra',
      subjectCode: 'MAT601',
      description: 'A comprehensive guide to linear algebra with an emphasis on abstraction and mathematical rigor, ideal for advanced undergraduates.',
      isbn: '978-3-319-11079-0',
      rating: 4.8,
      totalPages: 340,
      publisher: 'Springer',
      year: 2015,
      availableAt: [lib1._id, lib3._id, lib5._id],
      tags: ['mathematics', 'linear algebra', 'vectors', 'matrices']
    });

    const book2 = await Book.create({
      title: 'Introduction to Linear Algebra',
      author: 'Gilbert Strang',
      subject: 'Linear Algebra',
      subjectCode: 'MAT601',
      description: 'The classic textbook on linear algebra by MIT professor Gilbert Strang, covering all fundamental concepts with clarity.',
      isbn: '978-0-9802327-7-6',
      rating: 4.7,
      totalPages: 600,
      publisher: 'Wellesley-Cambridge Press',
      year: 2016,
      availableAt: [lib1._id, lib2._id, lib4._id],
      tags: ['mathematics', 'linear algebra', 'MIT', 'applications']
    });

    const book3 = await Book.create({
      title: 'Artificial Intelligence: A Modern Approach',
      author: 'Stuart Russell & Peter Norvig',
      subject: 'Machine Intelligence',
      subjectCode: 'CSM603',
      description: 'The definitive AI textbook used in universities worldwide, covering all aspects of artificial intelligence from search algorithms to machine learning.',
      isbn: '978-0-13-468999-1',
      rating: 4.9,
      totalPages: 1132,
      publisher: 'Pearson',
      year: 2020,
      availableAt: [lib1._id, lib3._id, lib5._id],
      tags: ['AI', 'machine learning', 'algorithms', 'computer science']
    });

    const book4 = await Book.create({
      title: 'Pattern Recognition and Machine Learning',
      author: 'Christopher Bishop',
      subject: 'Machine Intelligence',
      subjectCode: 'CSM603',
      description: 'A comprehensive introduction to the fields of pattern recognition and machine learning with Bayesian perspective.',
      isbn: '978-0-387-31073-2',
      rating: 4.7,
      totalPages: 738,
      publisher: 'Springer',
      year: 2006,
      availableAt: [lib3._id, lib5._id],
      tags: ['machine learning', 'statistics', 'Bayesian', 'neural networks']
    });

    const book5 = await Book.create({
      title: 'Real Analysis: Modern Techniques',
      author: 'Gerald Folland',
      subject: 'Real Analysis',
      subjectCode: 'MAT602',
      description: 'A rigorous treatment of real analysis, covering measure theory, integration, and functional analysis.',
      isbn: '978-0-471-31716-6',
      rating: 4.6,
      totalPages: 384,
      publisher: 'Wiley',
      year: 1999,
      availableAt: [lib1._id, lib3._id],
      tags: ['real analysis', 'measure theory', 'mathematics']
    });

    const book6 = await Book.create({
      title: 'Software Engineering: A Practitioner\'s Approach',
      author: 'Roger Pressman',
      subject: 'Software Engineering',
      subjectCode: 'CSM601',
      description: 'The most widely used software engineering textbook, covering agile methods, design patterns, and modern practices.',
      isbn: '978-0-07-337597-7',
      rating: 4.5,
      totalPages: 976,
      publisher: 'McGraw-Hill',
      year: 2014,
      availableAt: [lib1._id, lib2._id, lib4._id, lib5._id],
      tags: ['software engineering', 'agile', 'design patterns', 'SDLC']
    });

    const book7 = await Book.create({
      title: 'Data Mining: Concepts and Techniques',
      author: 'Jiawei Han, Micheline Kamber',
      subject: 'Data Mining',
      subjectCode: 'CSM604',
      description: 'A comprehensive guide to data mining, covering classification, clustering, association rules, and data warehousing.',
      isbn: '978-0-12-381479-1',
      rating: 4.6,
      totalPages: 744,
      publisher: 'Morgan Kaufmann',
      year: 2011,
      availableAt: [lib1._id, lib3._id, lib4._id],
      tags: ['data mining', 'machine learning', 'big data', 'algorithms']
    });

    // Update library book arrays
    await Library.findByIdAndUpdate(lib1._id, { books: [book1._id, book2._id, book3._id, book5._id, book6._id, book7._id] });
    await Library.findByIdAndUpdate(lib2._id, { books: [book2._id, book6._id] });
    await Library.findByIdAndUpdate(lib3._id, { books: [book1._id, book3._id, book4._id, book5._id, book7._id] });
    await Library.findByIdAndUpdate(lib4._id, { books: [book2._id, book6._id, book7._id] });
    await Library.findByIdAndUpdate(lib5._id, { books: [book1._id, book3._id, book4._id, book6._id] });

    // ── Marks ─────────────────────────────────────
    await Marks.create({
      studentId: student1._id,
      semester: 6,
      subjects: [
        { subjectCode: 'MAT601', subjectName: 'Linear Algebra', marksObtained: 35, maxMarks: 100, threshold: 40 },
        { subjectCode: 'MAT602', subjectName: 'Real Analysis', marksObtained: 72, maxMarks: 100, threshold: 40 },
        { subjectCode: 'CSM601', subjectName: 'Software Engineering', marksObtained: 45, maxMarks: 100, threshold: 40 },
        { subjectCode: 'CSM603', subjectName: 'Machine Intelligence', marksObtained: 28, maxMarks: 100, threshold: 40 },
        { subjectCode: 'CSM604', subjectName: 'Data Mining', marksObtained: 55, maxMarks: 100, threshold: 40 }
      ]
    });

    await Marks.create({
      studentId: student1._id,
      semester: 5,
      subjects: [
        { subjectCode: 'MAT501', subjectName: 'Abstract Algebra', marksObtained: 62, maxMarks: 100, threshold: 40 },
        { subjectCode: 'MAT502', subjectName: 'Differential Equations', marksObtained: 78, maxMarks: 100, threshold: 40 },
        { subjectCode: 'CSM501', subjectName: 'Database Systems', marksObtained: 85, maxMarks: 100, threshold: 40 },
        { subjectCode: 'CSM503', subjectName: 'Computer Networks', marksObtained: 70, maxMarks: 100, threshold: 40 },
        { subjectCode: 'CSM504', subjectName: 'Operating Systems', marksObtained: 55, maxMarks: 100, threshold: 40 }
      ]
    });

    await Marks.create({
      studentId: student2._id,
      semester: 6,
      subjects: [
        { subjectCode: 'MAT601', subjectName: 'Linear Algebra', marksObtained: 88, maxMarks: 100, threshold: 40 },
        { subjectCode: 'MAT602', subjectName: 'Real Analysis', marksObtained: 36, maxMarks: 100, threshold: 40 },
        { subjectCode: 'CSM601', subjectName: 'Software Engineering', marksObtained: 79, maxMarks: 100, threshold: 40 },
        { subjectCode: 'CSM603', subjectName: 'Machine Intelligence', marksObtained: 65, maxMarks: 100, threshold: 40 },
        { subjectCode: 'CSM604', subjectName: 'Data Mining', marksObtained: 31, maxMarks: 100, threshold: 40 }
      ]
    });

    await Marks.create({
      studentId: student3._id,
      semester: 4,
      subjects: [
        { subjectCode: 'CSM401', subjectName: 'Algorithms', marksObtained: 92, maxMarks: 100, threshold: 40 },
        { subjectCode: 'CSM402', subjectName: 'Theory of Computation', marksObtained: 34, maxMarks: 100, threshold: 40 },
        { subjectCode: 'MAT401', subjectName: 'Discrete Mathematics', marksObtained: 76, maxMarks: 100, threshold: 40 },
        { subjectCode: 'CSM403', subjectName: 'Computer Architecture', marksObtained: 58, maxMarks: 100, threshold: 40 },
        { subjectCode: 'CSM404', subjectName: 'Web Technologies', marksObtained: 82, maxMarks: 100, threshold: 40 }
      ]
    });

    console.log('✅ Seed data inserted successfully');
    console.log('📧 Admin: admin@edupath.com / admin123');
    console.log('📧 Student: agam@edupath.com / student123');
  } catch (err) {
    console.error('❌ Seed error:', err.message);
  }
}

module.exports = seed;

// Allow running directly
if (require.main === module) {
  require('dotenv').config();
  mongoose.connect(process.env.MONGODB_URI).then(async () => {
    await seed();
    mongoose.disconnect();
  });
}
