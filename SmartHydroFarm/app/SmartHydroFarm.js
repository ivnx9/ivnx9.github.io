  cfg.Dark
  cfg.MUI
  app.LoadScript( "loadScript.js" )
 
//Called when application is started.
function OnStart()
{    

    
   // update appUI
 var UPDATE_URL = "https://ivnx9.github.io/SmartHydroFarm/config.json";
app.HttpRequest("GET", UPDATE_URL, null, null, callback_version);  
 
    //Lock screen orientation to Portrait.
    app.SetOrientation( "Portrait" )

	//Create the main app layout.
	layMain = app.CreateLayout( "Linear", "Vertical,FillXY" );
	layMain.SetBackColor( "#454545" );

   	//Create the main app layout.
	layLoadingScreen= app.CreateLayout( "Linear", "Vertical,FillXY" );
	layLoadingScreen.SetBackGradient( "#000000", "#454545", "#000000");
  layMain.AddChild( layLoadingScreen )

  Displaylogo = app.CreateImage( "Img/SmartHydroFarm.png", 0.3,0.15)
  Displaylogo.SetMargins( 0, 0.35, 0,0)
  layLoadingScreen.AddChild( Displaylogo )

   //Create second image.
	img = app.CreateImage( "Img/loading.png", 0.4, -1)
	img.Scale( 0.3, 0.3 )
	img.Move( 0, 0.15 )
  img.SetMargins(0,-0.03,0, -0.025)
	layLoadingScreen.AddChild( img )

  DisplayText = app.CreateText( "Loading...", 0.5, 0.05,  "AutoScale" )
  DisplayText.SetTextSize( 20 )
 layLoadingScreen.AddChild( DisplayText )

  
   //Start timer to rotate top image.
RotateImage()
  
  main()
 // app.ShowPopup( "Processing Main content" )
}
var angle=0;
function RotateImage( ev )
{
	img.Rotate( angle )
	angle += 80;
 if(layLoadingScreen.IsEnabled() == true){
  setTimeout("RotateImage()", 150);
   }
}

function callback_version(error, reply, status) {

    // No internet / cannot connect
    if (error) {
        app.HttpRequest("GET", "https://www.google.com", null, null, (err, rep, stat)=>{
          if(err) {
               noInternet();
         } else {
          //  app.Alert( "Github is down." );
            continueAppNormally();
         }
      });

        return;
    }

    // URL not alive, GitHub page deleted, 404, 500, etc.
    if (status != 200) {
        app.ShowPopup("Update server not available.");
        continueAppNormally();
        return;
    }

    // Empty response
    if (!reply || reply.trim() == "") {
        app.ShowPopup("Update config is empty.");
        continueAppNormally();
        return;
    }

    // Invalid JSON protection
    var config;
    try {
        config = JSON.parse(reply);
    } catch (e) {
        app.ShowPopup("Update config is invalid.");
        continueAppNormally();
        return;
    }

    // Read local config safely
    var cver = {"version":"0.0.0"};

    try {
        var localConfig = app.ReadFile("config.json");
        if (isJson(localConfig)) {
            cver = JSON.parse(localConfig);
        }
    } catch (e) {}

    // Version check
    if (config.version != cver.version) {
        DisplayText.SetText("Updating app...");

        var merged = [...config.appjs, ...config.webpage];
        fetchPages(config, JSON.stringify(merged));
    } 
    else {
        continueAppNormally();
    }
}


function continueAppNormally() {
    layLogin.Animate("FadeIn");
    layLoadingScreen.Animate("FadeOut");
    app.ShowPopup("Authenticating...");
    layLoadingScreen.SetEnabled(false);
    setTimeout(InitAuth, 1000);
}



function isJson(value) {
  if (typeof value !== "string") return false;
  try {
    JSON.parse(value);
    return true;
  } catch {
    return false;
  }
}



function fetchPages(config, pages, index = 0) {
    if (index >= pages.length) {
        //app.ShowPopup("All files downloaded!.");
         
          app.WriteFile( "config.json", JSON.stringify(config, null, 2) )
         app.ShowPopup( "App has been updated to "+config.version )
       layLogin.Animate("FadeIn")
       layLoadingScreen.Animate("FadeOut")
        layLoadingScreen.SetEnabled( false  )
        InitAuth()
  
        return;
    }
    //app.Alert(pages);
    let page = JSON.parse(pages)[index];
    

    app.HttpRequest(
        "GET",
        config.host + config.PATH + "/" + page,
        null,
        null,
        (error, reply, status) => {

            if (error) {
                app.Alert("Something went wrong. Trying to update again. ");
              //  app.Exit()
            //    app.LaunchApp( "com.smarthydrofarm.shvf" , true)
              //  var action = "android.intent.action.MAIN";
             //  app.SendIntent( this.packageName, this.className, action ) 
                fetchPages(config, pages, reply, index = 0) 
            } else {
                app.WriteFile(page, reply);
                app.Debug("Saved: " + page);
            }

            //  load next file AFTER this finishes
            fetchPages(config,pages, index + 1);
        }
    );
}
