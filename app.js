const express = require('express');
const app = express()
const port = process.env.PORT || 3001
const nodemailer = require("nodemailer");
const { google } = require("googleapis");
const OAuth2 = google.auth.OAuth2;
const html_to_pdf = require('html-pdf-node');
const fs = require('fs');
const path = require('path');

const accountTransport = require("./account_transport.json");
const imageLogo = path.resolve("file:///public/img/logo2.png")
console.log("🚀 ~ file: app.js:13 ~ imageLogo:", imageLogo)


const OAuth = () => {
    const oauth2Client = new OAuth2(
        accountTransport.auth.clientId,
        accountTransport.auth.clientSecret,
        "https://developers.google.com/oauthplayground",
    );
    oauth2Client.setCredentials({
        refresh_token: accountTransport.auth.refreshToken,
        tls: {
            rejectUnauthorized: false
        }
    });
    oauth2Client.getAccessToken((err, token) => {
        if (err)
            return console.log(err);;
        accountTransport.auth.accessToken = token;
    });
};

async function PDF(data) {

  let options = { 
    format: 'A4',
    path: './public/pdf/ticket.pdf',
    margin: {
      top: '15mm',
      bottom: '15mm',
      left: '60mm',
      right: '20mm'
    }
  };
  
  //let options = { format: 'A4', args: ['--no-sandbox', '--disable-setuid-sandbox'] };
  
  let file = { content: 
  `<!DOCTYPE html>
  <html>
  <head>
  <meta charset="UTF-8">
  <title>Comprobante de pago</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300&display=swap" rel="stylesheet">
  </head>
  <style>
  body {
    font-family: 'Segoe UI', Arial, sans-serif;
  }
  </style>
    <h1>Comprobante de pago</h1>
    <h4>${data.id}</h4>
    <div>
      <h3 class="paragraph-title">Datos de facturación</h3>
      <p>${data.name}</p>
      <p>${data.adress}</p>
      <p>${data.city}</p>
      <p>${data.cp}</p>
    </div>
    <br>
    <div>
      <h3 class="paragraph-title">Datos de la compra</h3>
      <p>ID de transacción: ${data.transaction}</p>
      <p>Medio de pago: ${data.payment}</p>
      <p>Total: ${data.price}</p>
    </div>
    <img style="margin-top: 20px;" src= "${imageLogo}"/>
  </body>
  </html>` };

  await html_to_pdf.generatePdf(file, options).then(pdfBuffer => {
    fs.writeFileSync(options.path, pdfBuffer); 
    console.log("PDF saved successfully!");
  }).catch(error => {
    console.error("Error generating PDF:", error);
  });
}


async function main(data) {
 
    let transporter = nodemailer.createTransport(accountTransport)
    // send mail with defined transport object
    let info = await transporter.sendMail({
      from: 'ATIO <atio@example.com>', // sender address
      to: data.reciever, // list of receivers
      subject: "Comprobante de transaccion", // Subject line
      text: "Hello world?", // plain text body
      html: `<!DOCTYPE html>
      <html>
      <head>
      <meta charset="UTF-8">
      <title>Comprobante de pago</title>
      <style>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300&display=swap" rel="stylesheet">
      h1 {font-size: 24px;font-weight: bold;}
      h4 {font-size: 18px;font-weight: bold;}
      p {font-size: 14px;margin: 0;}.paragraph-title 
      {font-weight: bold;margin-bottom: 8px;}
      {font-family: 'Roboto', sans-serif;}
      </style>
      </head>
      <body>
        <h1>Comprobante de pago</h1>
        <h4>${data.id}</h4>
        <div>
          <p class="paragraph-title">Datos de facturación</p>
          <p>${data.name}</p>
          <p>${data.adress}</p>
          <p>${data.city}</p>
          <p>${data.cp}</p>
        </div>
        <br>
        <div>
          <p class="paragraph-title">Datos de la compra</p>
          <p>ID de transacción: ${data.transaction}</p>
          <p>Medio de pago: ${data.payment}</p>
          <p>Total: ${data.price}</p>
        </div>
        <img style="margin-top: 20px;" src="cid:logo"/>
      </body>
      </html>`,
      attachments: [{
        filename: 'logo2.png',
        path: './public/img/logo2.png',
        cid: 'logo',
        contentDisposition: 'inline'
    },
    {
      path: './public/pdf/ticket.pdf' 
    }]
    });
  
    console.log("Message sent: %s", info.messageId);
    // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>
  
    // Preview only available when sending through an Ethereal account
    console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...

    return ("Message sent: %s", info.messageId);
  };
  
  OAuth();

  
  app.listen(port, () => {
    console.log(`Nodemail app listening on port ${port}`)
  })    
  
  // Parse JSON request bodies
  app.use(express.json()); 
  
  // Enable CORS middleware
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*'); // Allow requests from any origin
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE'); // Allow the specified HTTP methods
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept'); // Allow the specified headers
    next();
  });
  
  app.post('/send', (req, res) => {
      
    let data = req.body
    
      PDF(data).then(() => 
      main(data)).then((result) => {
        res.json({ message: result });
      })
      .catch((error) => {
        console.error(error);
        res.sendStatus(500);
      })  
  })
  
  app.get('/', (req, res) => {
  
      res.send("hola mundo")
  
  })