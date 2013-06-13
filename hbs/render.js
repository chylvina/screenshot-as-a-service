/**
 *
 * Author: xiongliang.xl@alibaba-inc.com
 * Since: 13-6-13 下午4:38
 * Description:
 */

$(document).ready(function () {
  var imageTpl = Handlebars.templates['image.hbs'];
  var titleTpl = Handlebars.templates['title.hbs'];
  var textTpl = Handlebars.templates['text.hbs'];
  var navbarTpl = Handlebars.templates['navbar.hbs'];
  var linkTpl = Handlebars.templates['link.hbs'];
  var headerTpl = Handlebars.templates['header.hbs'];
  var footerImageTpl = Handlebars.templates['footer-image.hbs'];
  var footerTitleTpl = Handlebars.templates['footer-title.hbs'];
  var footerTextTpl = Handlebars.templates['footer-text.hbs'];
  var footerLinkTpl = Handlebars.templates['footer-link.hbs'];

  /// init Data
  contentData = contentData.replace(/&quot;/gmi, '"').replace(/[\r\n]/gm, '');
  var styleData = '';
  var contentObj = JSON.parse(contentData);
  //var styleObj = JSON.parse(styleData);
  /// header
  var headerHtml = headerTpl(contentObj.header);
  /// content
  var contentHtml = '';
  while(contentObj.content.length > 0) {
    var contentBlock = contentObj.content.shift();
    switch(contentBlock.t) {
      case 'image':
        contentHtml += imageTpl(contentBlock);
        break;
      case 'title':
        contentHtml += titleTpl(contentBlock);
        break;
      case 'text':
        contentHtml += textTpl(contentBlock);
        break;
      case 'link':
        contentHtml += linkTpl(contentBlock);
        break;
      case 'navbar':
        contentHtml += navbarTpl(contentBlock);
        break;
    }
  }
  /// footer
  var footerHtml = '';
  while(contentObj.footer.length > 0) {
    var footerBlock = contentObj.footer.shift();
    switch(footerBlock.t) {
      case 'image':
        footerHtml += footerImageTpl(footerBlock);
        break;
      case 'title':
        footerHtml += footerTitleTpl(footerBlock);
        break;
      case 'text':
        footerHtml += footerTextTpl(footerBlock);
        break;
      case 'link':
        footerHtml += footerLinkTpl(footerBlock);
        break;
    }
  }

  /// render
  $('base').attr('href', 'http://' + contentObj.host);
  $('#header').html(headerHtml);
  $('#content').html(contentHtml);
  $('#footer').html(footerHtml);
});