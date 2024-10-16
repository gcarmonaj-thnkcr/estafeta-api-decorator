import app from './index'

const port = process.env.PORT || 9000;

app.listen(port, () => {
  console.log("Server listenning on port" + port)
})
