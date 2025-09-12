// Middleware para parsing de requests
class RequestParser {
   // Parse do body da requisição
   static parseBody(body) {
      try {
         return JSON.parse(body);
      } catch (error) {
         return null;
      }
   }

   // Parse dos query parameters
   static parseQuery(queryString) {
      if (!queryString) return {};
      
      const params = {};
      const pairs = queryString.split('&');
      
      for (const pair of pairs) {
         const [key, value] = pair.split('=');
         if (key && value) {
            params[decodeURIComponent(key)] = decodeURIComponent(value);
         }
      }
      
      return params;
   }

   // Parse dos path parameters
   static parsePath(path, route) {
      const pathParams = {};
      const pathSegments = path.split('/');
      const routeSegments = route.split('/');
      
      for (let i = 0; i < routeSegments.length; i++) {
         if (routeSegments[i].startsWith(':')) {
            const paramName = routeSegments[i].substring(1);
            pathParams[paramName] = pathSegments[i];
         }
      }
      
      return pathParams;
   }

   // Middleware para processar request
   static middleware(req, res, next) {
      // Parse do body
      if (req.body) {
         req.parsedBody = RequestParser.parseBody(req.body);
      }

      // Parse dos query parameters
      if (req.queryStringParameters) {
         req.query = RequestParser.parseQuery(req.queryStringParameters);
      }

      next();
   }
}

module.exports = RequestParser;
