import multer from "multer";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/temp")
  },
  filename: function (req, file, cb) {

      cb(null, file.originalname)  // originalname , nhi rakhna na chaiye, kyki files ki copy ban sakit hai isliye unuiqe filename rakhna chaiye
  }
})

export const upload = multer({
    storage,
})