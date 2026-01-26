   function getVersionApp() {
       return "0.1.3";
   }
   
  function dashboardUI()
{
/*
	//cDashboard
   	txtCctv = app.CreateText( "<b>CCTV snapshot</b>", 0.3, 0.03, "FontAwesome, Left, Html" )
   	txtCctv.SetTextColor( "#000000" )
     txtCctv.SetMargins( -0.3, 0.02,0,0)
  	 txtCctv.SetTextSize( 17 )
     layContent_Dashboard.AddChild( txtCctv)

   cctv = app.CreateWebView( 1, 0.38)
   cctv.SetOnTouch( setVal )
   cctv.LoadHtml(' <script>   setInterval(() => {   const img = document.getElementById("snapshot"); img.src = "https://api.smarthydrofarm.com/images/SHVF-V1.jpg?rand=" + new Date().getTime();    }, 4000); </script><style>img {border: 4px solid #4CAF50;max-width: 98%; height: auto; animation: cctvPulse 2s infinite; }  @keyframes cctvPulse {  0% { border: 4px solid #00FF41; }50% { border: 4px solid #000000; }   100% { border: 4px solid #00FF41; }}</style><img id="snapshot" src="https://smarthydrofarm.com/api/images/SHVF-V1.jpg" alt="Live Image" /><br/>', "file:///Sys/"  )                  
   layContent_Dashboard.AddChild(cctv)
  

  	txtWeather = app.CreateText( "<b> Solar Coverage Info</b>", 0.95,  0.03, "FontAwesome, Left, Html" )
   	txtWeather.SetTextColor( "#000000" )
     txtWeather.SetMargins( 0.02, 0.02,0,0)
  	 txtWeather.SetTextSize( 17 )
     layContent_Dashboard.AddChild( txtWeather)

  weather = app.CreateWebView( 0.95, 0.38 )
 // weather.LoadHtml( '<h4>Solar Forecast (by Windy)</h4><iframe id="windyFrame" width="100%" height="250" frameborder="0" src="https://embed.windy.com/embed2.html?lat=14.6&lon=120.98&zoom=1&level=surface&overlay=solarpower&menu=&message=&marker=&calendar=now&pressure=&type=map&location=coordinates&detail=&detailLat=14&detailLon=121&metricWind=km%2Fh&metricTemp=%C2%B0C&radarRange=-1"></iframe>', "file:///Sys/" )
  weather.LoadUrl( "https://embed.windy.com/embed2.html?lat=14.6&lon=120.98&zoom=1&level=surface&overlay=solarpower&menu=&message=&marker=&calendar=now&pressure=&type=map&location=coordinates&detail=&detailLat=14&detailLon=121&metricWind=km%2Fh&metricTemp=%C2%B0C&radarRange=-1" )
  weather.SetBackColor( "#eeeeee" )
  layContent_Dashboard.AddChild(weather)
 

 //layGauge1 = app.CreateLayout( "Linear", "Horizontal" )
 // layContent_Dashboard.AddChild(layGauge1)

   gauge1 = app.CreateWebView( 1, 0.8,"NoActionBar,NoScrollBars, NoLongTouch")
   gauge1.LoadUrl( "gauge.html" )
   gauge1.SetBackColor( "#ffffff" )
   layContent_Dashboard.AddChild( gauge1 )
 
  /*
	//Create a text label heart icon.
	txtIcon = app.AddText( layContent_Dashboard, "[fa-home]", 0.8, 0.12, "FontAwesome" )
	txtIcon.SetTextColor( "#4285F4" );
	txtIcon.SetTextSize( 80 )

	//Create text with an external link.
    var txt = "<p><font color=#4285F4><big>Welcome</big></font></p><br>" + 
    "<p><a href=https://play.google.com/store>Play Store</a></p>"
    txtContent = app.AddText( layContent_Dashboard, txt, 1, -1, "Html,Link" )
    txtContent.SetTextSize( 18 )

     cctv = app.AddImage( layContent_Dashboard, "Img/clear.png", 0.9, 0.8)
 */

   dashboardWebView = app.CreateWebView( 1, 0.95,"NoActionBar,NoScrollBars, NoLongTouch")
   dashboardWebView.LoadUrl( "dboard.html" ) 
   layContent_Dashboard.AddChild( dashboardWebView )
}

function control_and_configUI() 
{
   controlWebView = app.CreateWebView( 1, 0.95,"NoActionBar,NoScrollBars, NoLongTouch")
    controlWebView.LoadUrl( "control_config.html" ) 
   layContent_Control_config.AddChild( controlWebView )
}

/*
   layContent_Control_config = app.CreateLayout( "Linear", "VCenter, FillXY" )
    layContent_Webhooks = app.CreateLayout( "Linear", "VCenter, FillXY" )
    layContent_Chatbot = app.CreateLayout( "Linear", "VCenter, FillXY" )
    layContent_About = app.CreateLayout( "Linear", "VCenter, FillXY" )
    layContent_Settings = app.CreateLayout( "Linear", "VCenter, FillXY" )

*/
     function webhooksUI()
{
  // layContent_Webhooks
  webhooksWebView = app.CreateWebView( 1, 0.95,"NoActionBar,NoScrollBars, NoLongTouch")
    webhooksWebView.LoadUrl( "webhooks.html" ) 
   layContent_Webhooks.AddChild( webhooksWebView )
   
}
     function chatbotUI()
{
    // layContent_Chatbot
   chatbotWebView = app.CreateWebView( 1, 0.95,"NoActionBar,NoScrollBars, NoLongTouch")
    chatbotWebView.LoadUrl( "chatbot.html" ) 
   layContent_Chatbot.AddChild( chatbotWebView )
}
     function aboutUI()
{
    aboutWebView = app.CreateWebView( 1, 0.95,"NoActionBar,NoScrollBars, NoLongTouch")
    aboutWebView.LoadUrl( "about.html" ) 
   layContent_About.AddChild( aboutWebView )
}
     function settingsUI()
{
   // layContent_Settings
}

 function renderGauge()
{
   
  //  Ph, TDSwater temp, water level, humidity, air temp,
    /*
     ph                      |    TDS
     Water Temp    |    water level
      air temp          |  Humidity
 */
 // gauge1.LoadUrl( "gauge.html" )

  if(gauge1.GetVisibility() == "Show" ){
      	gauge1.Execute( "if(typeof DrawGaugePh === 'function') DrawGaugePh( 'g_ph',  'pH Level' ); ");
    	  gauge1.Execute( "if(typeof DrawGaugeTds === 'function') DrawGaugeTds('g_tds',   'TDS Level' ); " );
      	gauge1.Execute( "if(typeof DrawGauge_WaterTemp === 'function') DrawGauge_WaterTemp('g_waterTemp', 'Water Temperature'); " );
      	gauge1.Execute( "if(typeof DrawGaugeWaterLevel === 'function') DrawGaugeWaterLevel('g_waterLevel', 'Water Level'); " );
      	gauge1.Execute( "if(typeof DrawGauge_Air === 'function') DrawGauge_Air('g_air', 'Temp'); " );
      	gauge1.Execute( "if(typeof DrawGaugeHumidity === 'function') DrawGaugeHumidity('g_humidity', 'Humidity');  " );

        setTimeout(  StartGaugeAutoUpdate, 1000);
  }
}
/* ===== OPTIONAL DEMO INIT (remove if main code calls your draw functions) =====
    document.addEventListener("DOMContentLoaded", () => {
  DrawGaugePh("g_ph", "pH Level");
  DrawGaugeTds("g_tds", "TDS Level");
  DrawGauge_WaterTemp("g_waterTemp", "Water Temp");
  DrawGaugeWaterLevel("g_waterLevel", "Water Level");
  DrawGauge_Air("g_air", "Air Temp");
  DrawGaugeHumidity("g_humidity", "Humidity");

  // Example values
  setGaugeValue("g_ph", 6.4);
  setGaugeValue("g_tds", 850);
  setGaugeValue("g_waterTemp", 30);
  setGaugeValue("g_waterLevel", 120);
  setGaugeValue("g_air", 27);
  setGaugeValue("g_humidity", 55);
});
*/

// ====== CONFIG ======
var API_BASE = "https://smarthydrofarm.com/api/webhook.php";  // change if needed (full URL recommended)
var POLL_MS  = 1500;               // 1.5s (adjust)

// Active device creds (set these from your app)
var DEVICE_ID   = "SHVF-V1";
var DEVICE_CODE = "12345";

// Cache last sent values so it only updates when changed
var lastVals = {
  ph: null, tds: null, waterTemp: null, waterLiters: null, air: null, hum: null
};

// ====== Call this once after gauge1 is ready ======
function StartGaugeAutoUpdate() {
  StopGaugeAutoUpdate();     // avoid duplicates
  PollDashboardOnce();       // immediate
  _pollTimer = setInterval(PollDashboardOnce, POLL_MS);
}

function StopGaugeAutoUpdate() {
  if (typeof _pollTimer !== "undefined" && _pollTimer) {
    clearInterval(_pollTimer);
    _pollTimer = null;
  }
}

// ====== Fetch panel from DB via webhook.php ======
function PollDashboardOnce() {
  var url = API_BASE + "?cmd=panel"
    + "&device_id=" + encodeURIComponent(DEVICE_ID)
    + "&device_code=" + encodeURIComponent(DEVICE_CODE);

  // DroidScript: Ajax(url, callback)
  app.HttpRequest("GET", url, null, null, function(error, reply) {
    if (error) {
      // optional: app.Debug / app.ShowPopup
      // app.Debug("Poll error: " + error);
      return;
    }

    var data = null;
    try {
      data = JSON.parse(reply);
    } catch (e) {
      // app.Debug("Bad JSON: " + reply);
      return;
    }

    // Extract latest sensor values (from your dashboard structure)
    var s = (data && data.latest_sensor) ? data.latest_sensor : {};

    // Your DB keys in the dashboard:
    // ph, tds, water_temp, air_temp, humidity, drumLiters
    var nowVals = {
      ph:         safeNum(s.ph),
      tds:        safeNum(s.tds),
      waterTemp:  safeNum(s.water_temp),
      waterLiters:safeNum(s.drumLiters),
      air:        safeNum(s.air_temp),
      hum:        safeNum(s.humidity)
    };

    // Update ONLY if changed
    ApplyGaugeChanges(nowVals);
  });
}

// ====== Only update when changed ======
function ApplyGaugeChanges(v) {
  // if gauge1 not ready, skip
  if (!gauge1) return;

  // ph
  if (v.ph !== null && v.ph !== lastVals.ph) {
    gauge1.Execute("setGaugeValue('g_ph'," + v.ph + ")");
    lastVals.ph = v.ph;
  }

  // tds
  if (v.tds !== null && v.tds !== lastVals.tds) {
    gauge1.Execute("setGaugeValue('g_tds'," + v.tds + ")");
    lastVals.tds = v.tds;
  }

  // water temp
  if (v.waterTemp !== null && v.waterTemp !== lastVals.waterTemp) {
    gauge1.Execute("setGaugeValue('g_waterTemp'," + v.waterTemp + ")");
    lastVals.waterTemp = v.waterTemp;
  }

  // water level (liters)
  if (v.waterLiters !== null && v.waterLiters !== lastVals.waterLiters) {
    gauge1.Execute("setGaugeValue('g_waterLevel'," + v.waterLiters + ")");
    lastVals.waterLiters = v.waterLiters;
  }

  // air temp
  if (v.air !== null && v.air !== lastVals.air) {
    gauge1.Execute("setGaugeValue('g_air'," + v.air + ")");
    lastVals.air = v.air;
  }

  // humidity
  if (v.hum !== null && v.hum !== lastVals.hum) {
    gauge1.Execute("setGaugeValue('g_humidity'," + v.hum + ")");
    lastVals.hum = v.hum;
  }
}

// ====== Helpers ======
function safeNum(x) {
  if (x === undefined || x === null || x === "") return null;
  var n = Number(x);
  return isNaN(n) ? null : n;
}


function setVal()
{
   
	  StartGaugeAutoUpdate()
/*
   gauge1.Execute( "setGaugeValue('g_ph', " + (value) + ")" );
   gauge1.Execute( "setGaugeValue('g_tds', " + (value) + ")" );
   gauge1.Execute( "setGaugeValue('g_waterTemp', " + (value) + ")" );
   gauge1.Execute( "setGaugeValue('g_waterLevel', " + (value) + ")" );
   gauge1.Execute( "setGaugeValue('g_air', " + (value) + ")" );
   gauge1.Execute( "setGaugeValue('g_humidity', " + (value) + ")" );

  */
}


/*
//Called when user touches seek bar.
function skb_OnTouch( value )
{
	if( spinStyle.GetText()=="Speed" ) 
		web.Execute( "gauge.setValue(" + (220*value/100) + ")" );
		
	else if( spinStyle.GetText()=="Temperature" ) 
		web.Execute( "gauge.setValue(" + (value-50) + ")" );
		
	else if( spinStyle.GetText()=="Delay" ) 
		web.Execute( "gauge.setValue(" + (value*10) + ")" );
	else 
		web.Execute( "gauge.setValue(" + (value) + ")" );
}


*/