const express = require("express");
const app = express();
app.use(express.json({ limit: "500mb" }));
app.use(express.urlencoded({ limit: "500mb", extended: true }));
const cors = require("cors");
app.use(cors());
const user_index = require("./User/user_index");
const admin_index = require("./Admin/admin_index");
const jilla_index = require("./Jilla/Jilla_index");

app.use('/api', user_index);
app.use('/api', admin_index);
app.use('/api', jilla_index);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});