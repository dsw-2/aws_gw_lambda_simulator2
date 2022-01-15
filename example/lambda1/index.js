
"use strict";

// =======================================================================================================
// =======================================================================================================

exports.handler = async (event, context) =>
{
   console.log(event);

   var response = {
      statusCode: 200,
      headers: {
         "Content-Type": "application/json"
      },
      isBase64Encoded: false,
      body: JSON.stringify({lambda: "lambda2", event: event})
   };

   return response;
};