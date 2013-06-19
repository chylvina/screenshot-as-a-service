
/*
 *导航风格模板
 */
(function(){


  /*
   *颜色风格模板
   */
  var themeColor = {

    defaulted : function(){
      $('body').attr('class','');
    },

    red : function(){
      $('body').attr('class','');
      $('body').addClass('theme-red');
    },

    green : function(){
      $('body').attr('class','');
      $('body').addClass('theme-green');
    },

    blue : function(){
      $('body').attr('class','');
      $('body').addClass('theme-blue');
    }

  }

  /*调用 颜色风格模板*/
  $('.default').click(function(){
    themeColor.defaulted();
  });
  $('.red').click(function(){
    themeColor.red();
  });
  $('.green').click(function(){
    themeColor.green();
  });
  $('.blue').click(function(){
    themeColor.blue();
  })


  $(document).ready(function(){
    var url=window.location.href;
    var spo=url.indexOf("?");
    var strparam=url.substr(spo);
    var params=strparam.split(/=|&/);
    var paramColor=params[1];
    if(paramColor){
      switch(paramColor){
        case 'default':
          themeColor.defaulted();
          break;
        case 'red':
          themeColor.red();
          break;
        case 'green':
          themeColor.green();
          break;
        case 'blue':
          themeColor.blue();
          break;
        default:
      }
    }
  });

})();