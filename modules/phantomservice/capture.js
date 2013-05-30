/**
 *
 * Author: xiongliang.xl@alibaba-inc.com
 * Since: 13-5-30 上午10:25
 * Description:
 */

/*
 * Screenshot service
 *
 * Generate a screenshot file on the server under the basePath
 *
 * Usage:
 * GET /
 * url: http://www.google.com
 *
 * Optional headers:
 * filename: google.png
 * width: 1024
 * height: 600
 * clipRect: { "top": 14, "left": 3, "width": 400, "height": 300 }
 *
 * If path is omitted, the service creates it based on the url, removing the
 * protocol and replacing all slashes with dots, e.g
 * http://www.google.com => www.google.com.png
 *
 * width and height represent the viewport size. If the content exceeds these
 * boundaries and has a non-elastic style, the screenshot may have greater size.
 * Use clipRect to ensure the final size of the screenshot in pixels.
 *
 * All settings of the WebPage object can also be set using headers, e.g.:
 * javascriptEnabled: false
 * userAgent: Mozilla/5.0 (iPhone; U; CPU like Mac OS X; en) AppleWebKit/420+
 */

exports.do = function (request, response) {
  console.log('------------- Starting: ' + url);
  page.open(url, function (status) {
    if (status == 'success') {
      console.log('Open url success: ' + url);
      window.setTimeout(function () {
        page.render(path);
        console.log('Capture url success: ' + url);
        response.statusCode = 200;
        response.write('Success: Screenshot saved to ' + path + "\n");
        page.release();
        response.close();
      }, delay);
    }
    else {
      console.log('Open url failed: ' + url);
      response.statusCode = 404;
      response.write('Error: Url returned status ' + status + "\n");
      page.release();
      response.close();
    }
  });
  // must start the response now, or phantom closes the connection
  //response.statusCode = 200;
  //response.write('');
};