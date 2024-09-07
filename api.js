exports.handler = async (event, context) => {
    if (event.httpMethod === 'GET' && context.path === 'lifetime' ) {
      try {
        // Process the GET request as needed
        const data = require('./db.json');
  
        // Return the data as the response
        return {
          statusCode: 200,
          body: JSON.stringify(data.items),
        };
      } catch (error) {
        // Return an error response if there was an issue processing the request
        return {
          statusCode: 500,
          body: JSON.stringify({ error: `Failed to process GET request ${error}` }),
        };
      }
    }
    
    if (event.httpMethod === 'GET' && context.path === 'pvd-service' ) {
        try {
          // Process the GET request as needed
          const data = require('./db.json');
    
          // Return the data as the response
          return {
            statusCode: 200,
            body: JSON.stringify(data.items),
          };
        } catch (error) {
          // Return an error response if there was an issue processing the request
          return {
            statusCode: 500,
            body: JSON.stringify({ error: `Failed to process GET request ${error}` }),
          };
        }
      }
  };

  export const config = {
    path: [
        "/lifetimes", 
        "/pvd-service/:qr"
    ]
  }