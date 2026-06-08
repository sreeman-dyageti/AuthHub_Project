import express from "express";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import pg from "pg";

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "authhub",
  password: "sreeman@db",
  port: 5432,
});

db.connect();

db.query("SELECT * FROM capitals", (err, res) => {
  if (err) {
    console.error("Error executing query", err.stack);
  } else {
    quiz = res.rows;
  }
  db.end();
});