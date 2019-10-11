const express = require('express');
const app = express();
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const storage = multer.diskStorage({
  destination: path.resolve(__dirname, 'uploads'),
  filename: function(req, file, cb) {
    cb(null, `${file.fieldname}-${Date.now()}.csv`)
  }
});
const upload = multer({ storage });

app.use(express.static(path.resolve(__dirname)));
app.use(cors());

app.post('/file', upload.single('info'), (req, res) => {
  const csvFile = fs.readFileSync(req.file.path, 'utf-8');
  const csvFileArray = csvFile.split('\n').map(row => row.split(','));
  const withoutOldHeaders = csvFileArray.slice((+req.body.headerRow || 0) + 1);

  const columnNameMap = JSON.parse(req.body.columnNameMap);
  const result = [];
  for (let i = 0; i < withoutOldHeaders.length; i++) {
    const currentRow = withoutOldHeaders[i];
    const transformedRow = [];

    for (let j = 0; j < currentRow.length; j++) {
      if (typeof columnNameMap[j] !== 'undefined') {
        transformedRow.push(currentRow[j]);
      }
    }

    result.push(transformedRow);
  }

  const keys = Object.keys(columnNameMap).sort();
  const headers = keys.map(key => {
    return columnNameMap[key];
  });
  result.unshift(headers);
  const csvString = result.join('\n');
  fs.writeFileSync(path.resolve(__dirname, 'outputs', req.file.filename), csvString);

  res.json({ status: 'ok', newFile: `http://localhost:3000/outputs/${req.file.filename}`});
});

const listener = app.listen(3000, () => {
  console.log(`Server is listening on ${listener.address().port}`);
});