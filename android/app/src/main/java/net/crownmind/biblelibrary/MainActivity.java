package net.crownmind.biblelibrary;
import android.app.Activity;
import android.os.Bundle;
import android.net.Uri;
import android.content.Intent;
import android.content.ActivityNotFoundException;
import android.webkit.*;
import android.widget.FrameLayout;
import android.widget.Toast;
import androidx.webkit.WebViewAssetLoader;
public class MainActivity extends Activity {
 private WebView web;
 private static final String START="https://appassets.androidplatform.net/assets/bible/index.html";
 @Override public void onCreate(Bundle state){
  super.onCreate(state);FrameLayout root=new FrameLayout(this);web=new WebView(this);root.addView(web,new FrameLayout.LayoutParams(-1,-1));setContentView(root);
  root.setOnApplyWindowInsetsListener((v,i)->{v.setPadding(i.getSystemWindowInsetLeft(),i.getSystemWindowInsetTop(),i.getSystemWindowInsetRight(),i.getSystemWindowInsetBottom());return i;});root.requestApplyInsets();
  if(android.os.Build.VERSION.SDK_INT>=33)getOnBackInvokedDispatcher().registerOnBackInvokedCallback(android.window.OnBackInvokedDispatcher.PRIORITY_DEFAULT,()->handleBack());
  WebSettings settings=web.getSettings();settings.setJavaScriptEnabled(true);settings.setDomStorageEnabled(true);settings.setAllowFileAccess(false);settings.setAllowContentAccess(false);settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
  WebView.setWebContentsDebuggingEnabled(BuildConfig.DEBUG);
  final WebViewAssetLoader loader=new WebViewAssetLoader.Builder().addPathHandler("/assets/",new WebViewAssetLoader.AssetsPathHandler(this)).build();
  web.setWebViewClient(new WebViewClient(){
   @Override public WebResourceResponse shouldInterceptRequest(WebView v,WebResourceRequest r){return loader.shouldInterceptRequest(r.getUrl());}
   @Override public boolean shouldOverrideUrlLoading(WebView v,WebResourceRequest r){
    Uri u=r.getUrl();if("https".equals(u.getScheme())&&"appassets.androidplatform.net".equals(u.getHost())&&u.getPath()!=null&&u.getPath().startsWith("/assets/bible/"))return false;
    if(r.isForMainFrame()&&("https".equals(u.getScheme())||"http".equals(u.getScheme())||"mailto".equals(u.getScheme())))try{startActivity(new Intent(Intent.ACTION_VIEW,u));}catch(ActivityNotFoundException e){Toast.makeText(MainActivity.this,"No app available for this link",Toast.LENGTH_SHORT).show();}
    return true;
   }
  });
  if(state==null||web.restoreState(state)==null)web.loadUrl(START);
 }
 @Override public void onBackPressed(){handleBack();}
 private void handleBack(){web.evaluateJavascript("(()=>{const d=document.querySelector('dialog[open]');if(d){d.close();return true;}if(typeof view==='function'&&document.getElementById('readView').hidden){view('read');return true;}return false;})()",v->{if(!"true".equals(v)){if(web.canGoBack())web.goBack();else finish();}});}
 @Override protected void onSaveInstanceState(Bundle b){super.onSaveInstanceState(b);web.saveState(b);}
 @Override protected void onPause(){web.onPause();super.onPause();}
 @Override protected void onResume(){super.onResume();if(web!=null)web.onResume();}
 @Override protected void onDestroy(){web.destroy();super.onDestroy();}
}
