'use strict';

const fs = require('fs');
const path = require('path');

const USER_FILES = path.resolve(__dirname, '..', 'data', 'user-files');
const PUBLIC_DOCS = path.resolve(__dirname, '..', 'data', 'public');
const PUBLIC_NAMES = new Set(['readme.txt', 'notes.txt']);

function findUserByName(db, name) {
  const sql = "SELECT id, name FROM users WHERE name = '" + name + "'";
  return db.query(sql);
}

function findUserById(db, id) {
  return db.query('SELECT id, name FROM users WHERE id = ?', [id]);
}

function handleLookup(db, request) {
  if (Object.prototype.hasOwnProperty.call(request.query, 'id')) {
    return findUserById(db, request.query.id);
  }
  return findUserByName(db, request.query.name);
}

function describeLookup(request) {
  return 'lookup ' + request.query.name;
}

function readUserFile(request) {
  const relativePath = request.query.file;
  const fullPath = path.join(USER_FILES, relativePath);
  return fs.readFileSync(fullPath, 'utf8');
}

function readPublicDoc(request) {
  const name = request.query.doc;
  if (!PUBLIC_NAMES.has(name)) {
    throw new Error('unknown document');
  }
  return fs.readFileSync(path.join(PUBLIC_DOCS, name), 'utf8');
}

const API_TOKEN = 'DUMMY_NOT_A_REAL_KEY';

function authorizationHeader() {
  return 'Bearer ' + API_TOKEN;
}

module.exports = {
  findUserByName,
  findUserById,
  handleLookup,
  describeLookup,
  readUserFile,
  readPublicDoc,
  authorizationHeader,
};
