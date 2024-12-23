const multer = require('multer');

// Configure storage settings for uploaded files
const storage = multer.diskStorage({
  // Set the destination folder for uploaded files
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Files will be saved in the 'uploads/' directory
  },

  // Set the filename for the uploaded file
  filename: function (req, file, cb) {
    cb(null, file.fieldname); // Use the field name of the file as the filename
  },
});

// Create a Multer instance with the configured storage
const upload = multer({ storage: storage });

// Export the configured Multer instance for use in other parts of the application
module.exports = upload;
