function getURL(e,t){var a=Ti.Network.createHTTPClient();a.onload=function(){t(a.responseText)},a.onerror=function(t){Ti.API.info("Error loading "+e),Ti.API.info(t)},a.timeout=3e3,a.open("GET",e),a.send()}function removeChars(e,t){return e=e.replace(new RegExp(t,"g"),"")}versionCompare=function(e,t){if(typeof e+typeof t!="stringstring")return!1;for(var a=e.split("."),n=t.split("."),s=0,r=Math.max(a.length,n.length);r>s;s++){if(a[s]&&!n[s]&&parseInt(a[s])>0||parseInt(a[s])>parseInt(n[s]))return 1;if(n[s]&&!a[s]&&parseInt(n[s])>0||parseInt(a[s])<parseInt(n[s]))return-1}return 0},exports.openAppPage=function(e){e&&Ti.Platform.openURL("itms-apps://itunes.apple.com/"+Ti.Locale.currentLanguage+"/app/id"+e)},exports.checkForAppUpdate=function(e,t){getURL("https://itunes.apple.com/lookup?id="+e,function(e){try{var a=JSON.parse(e).results[0].version,n=Ti.App.version;1==versionCompare(a,n)?t(a):Ti.API.info("No new version available")}catch(s){Ti.API.info("TiStoreCheck JSON korrupt")}})};