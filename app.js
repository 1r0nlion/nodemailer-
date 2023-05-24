const express = require('express');
const app = express()
const port = process.env.PORT || 3001
const nodemailer = require("nodemailer");
const { google } = require("googleapis");
const OAuth2 = google.auth.OAuth2;
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
require("dotenv").config

const accountTransport = require("./account_transport.json");

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

  // launch a new chrome instance
  const browser = await puppeteer.launch({
    args: [
      "--disable-setuid-sandbox",
      "--no-sandbox",
      "--single-process",
      "--no-zygote",
    ],
    executablePath: process.env.NODE_ENV === "production"
    ? process.env.PUPPETEER_EXECITABLE_PATH
    : puppeteer.executablePath(),
    headless: true
  })

  // create a new page
  const page = await browser.newPage()

  // set your html as the pages content
  const html = `<!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8" />
      <title>INVOIC</title>
      <style>
        .invoice-box {
          max-width: 800px;
          margin: auto;
          padding: 30px;
          border: 1px solid #eee;
          box-shadow: 0 0 10px rgba(0, 0, 0, 0.15);
          font-size: 16px;
          line-height: 24px;
          font-family: 'Helvetica Neue', 'Helvetica', Helvetica, Arial, sans-serif;
          color: #555;
        }
        .invoice-box table {
          width: 100%;
          line-height: inherit;
          text-align: left;
        }
        .invoice-box table td {
          padding: 5px;
          vertical-align: top;
        }
        .invoice-box table tr td:nth-child(2) {
          text-align: right;
        }
        .invoice-box table tr.top table td {
          padding-bottom: 20px;
        }
        .invoice-box table tr.top table td.title {
          font-size: 45px;
          line-height: 45px;
          color: #333;
        }
        .invoice-box table tr.information table td {
          padding-bottom: 40px;
        }
        .invoice-box table tr.heading td {
          background: #eee;
          border-bottom: 1px solid #ddd;
          font-weight: bold;
        }
        .invoice-box table tr.details td {
          padding-bottom: 20px;
        }
        .invoice-box table tr.item td {
          border-bottom: 1px solid #eee;
        }
        .invoice-box table tr.item.last td {
          border-bottom: none;
        }
        .invoice-box table tr.total td:nth-child(2) {
          border-top: 2px solid #eee;
          font-weight: bold;
        }
  
        @media only screen and (max-width: 600px) {
          .invoice-box table tr.top table td {
            width: 100%;
            display: block;
            text-align: center;
          }
          .invoice-box table tr.information table td {
            width: 100%;
            display: block;
            text-align: center;
          }
        }
  
        /** RTL **/
        .invoice-box.rtl {
          direction: rtl;
          font-family: Tahoma, 'Helvetica Neue', 'Helvetica', Helvetica, Arial, sans-serif;
        }
  
        .invoice-box.rtl table {
          text-align: right;
        }
  
        .invoice-box.rtl table tr td:nth-child(2) {
          text-align: left;
        }
      </style>
    </head>
    <body>
      <div class="invoice-box">
        <table cellpadding="0" cellspacing="0">
          <tr class="top">
            <td colspan="2">
              <table>
                <tr>
                  <td class="title">
                    <img src="https://static.wixstatic.com/media/26c657_ffcf772b2a1f4b3ea95f86ba1dca6e8c~mv2.png/v1/crop/x_10,y_1,w_1262,h_509/fill/w_260,h_104,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/Logo%20ATIO%20Int%20H.png" style="width: 100%; max-width: 300px" />
                  </td>
                  <td>
                    Invoice #:${data.id}<br /><br />
                    Created: January 1, 2015<br />
                    Due: February 1, 2015
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr class="information">
            <td colspan="2">
              <table>
                <tr>
                  <td>
                   ATIO Inc.<br />
                    Chacabuco 661<br />
                    Sunnyville, CA 12345
                  </td>
                  <td>
                    ${data.name}<br />
                    ${data.adress}<br />
                    ${data.city}<br />
                    ${data.cp}<br />
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr class="heading">
            <td>Payment Method</td>
            <td>Check #</td>
          </tr>
          <tr class="details">
            <td>Check</td>
            <td>1000</td>
          </tr>
          <tr class="heading">
            <td>Item</td>
            <td>Price</td>
          </tr>
          <tr class="item">
            <td>Website design</td>
            <td>$300.00</td>
          </tr>
          <tr class="item">
            <td>Hosting (3 months)</td>
            <td>$75.00</td>
          </tr>
          <tr class="item last">
            <td>Domain name (1 year)</td>
            <td>$10.00</td>
          </tr>
          <tr class="total">
            <td></td>
            <td>Total:${data.price}<br /></td>
          </tr>
        </table>
      </div>
    </body>
  </html>`
  await page.setContent(html, {
    waitUntil: 'domcontentloaded'
  })

  // or a .pdf file
  await page.pdf({
    format: 'A4',
    path: `${__dirname}/public/pdf/ticket.pdf`
  })

  // close the browser
  await browser.close()

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
        <img style="margin-top: 30px; margin-bottom: 30px; margin-left: 10px;" src="cid:logo"/>
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