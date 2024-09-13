# Invoice Conversion App

The **Invoice Conversion App** is a powerful tool designed to streamline the invoicing process for businesses in Romania. By converting ANAF's eFactură XML files into Excel formats compatible with popular invoicing applications, and integrating OCR capabilities for old invoices, this app simplifies data management and enhances productivity.

## Table of Contents

- [Background](#background)
- [Features](#features)
  - [eFactură XML to Excel Conversion](#efactură-xml-to-excel-conversion)
  - [Integration with Invoicing Applications](#integration-with-invoicing-applications)
  - [OCR Integration for Old Invoices](#ocr-integration-for-old-invoices)
- [Getting Started](#getting-started)
- [Usage](#usage)
- [Requirements](#requirements)
- [Support](#support)
- [License](#license)

## Background

**ANAF** (Agenția Națională de Administrare Fiscală) is the Romanian National Agency for Fiscal Administration. They have introduced **eFactură**, an electronic invoicing system that provides invoices in XML format. While this system enhances efficiency, many businesses require these invoices in Excel format to import data into their existing invoicing applications.

## Features

### eFactură XML to Excel Conversion

- **Seamless Conversion**: Transform ANAF's eFactură XML invoices into Excel files effortlessly.
- **Data Integrity**: Ensure all invoice data is accurately mapped and preserved during conversion.
- **User-Friendly Interface**: Easy-to-use interface that requires minimal technical knowledge.

### Integration with Invoicing Applications

The app generates Excel files compatible with multiple popular invoicing applications:

- **Facturis**
- **SmartBill**
- **Oblio**
- **Freya**

This compatibility allows businesses to import invoices directly into their preferred software without manual data entry.

### OCR Integration for Old Invoices

- **Python Script Integration**: Leverages a Python script utilizing Vertex AI for Optical Character Recognition (OCR).
- **PDF to Excel Conversion**: Convert old PDF invoices into Excel format.
- **Data Import**: Import legacy invoices into your invoicing applications seamlessly.

## Getting Started

1. **Download the App**: Obtain the latest version of the Invoice Conversion App from the [official website](#).
2. **Install Dependencies**: Ensure that Python and necessary libraries (for OCR functionality) are installed.
3. **Configure Settings**: Set up your preferences for invoice conversion and application integration.

## Usage

1. **eFactură Conversion**:
   - Open the app and select the eFactură XML file you wish to convert.
   - Choose the target invoicing application format (Facturis, SmartBill, Oblio, or Freya).
   - Click on **Convert** to generate the Excel file.

2. **OCR for Old Invoices**:
   - Access the OCR feature within the app.
   - Upload your PDF invoice files.
   - Initiate the OCR process to convert and extract data into an Excel file.

## Requirements

- **Operating System**: Windows/Linux/MacOS
- **Python**: Version 3.7 or higher
- **Libraries**:
  - Vertex AI SDK for Python
  - OpenPyXL or Pandas for Excel manipulation
- **Internet Connection**: Required for OCR processing with Vertex AI

## Support

For assistance, please contact our support team:

- **Email**: support@invoiceconversionapp.com
- **Phone**: +40 712 345 678

## License

This project is licensed under the [MIT License](#).

---

*Disclaimer: This app is designed to assist with invoice data management and is not affiliated with ANAF or the developers of Facturis, SmartBill, Oblio, or Freya.*
