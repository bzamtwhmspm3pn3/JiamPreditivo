// backend/routes/google-search.js
const express = require("express");
const axios = require("axios");
const router = express.Router();

router.get("/", async (req, res) => {
  const { query } = req.query;
  try {
    const response = await axios.get("https://www.googleapis.com/customsearch/v1", {
      params: {
        key: process.env.GOOGLE_API_KEY,
        cx: process.env.GOOGLE_CX,
        q: query,
        hl: "pt"
      }
    });
    const results = response.data.items?.map(item => ({
      title: item.title,
      snippet: item.snippet,
      link: item.link
    })) || [];
    res.json({ results });
  } catch (err) {
    console.error(err);
    res.status(500).json({ results: [] });
  }
});

module.exports = router;