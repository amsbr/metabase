//
//  MainViewController.m
//  Metabase
//
//  Created by Cam Saul on 9/21/15.
//  Copyright (c) 2015 Metabase. All rights reserved.
//

@import JavaScriptCore;
@import QuartzCore;
@import WebKit;

#import "INAppStoreWindow.h"

#import "MainViewController.h"
#import "SettingsManager.h"
#import "TaskHealthChecker.h"

@interface MainViewController ()
@property (weak) IBOutlet NSImageView *loadingView;
@property (weak) IBOutlet WebView *webView;
@property (strong) IBOutlet NSView *titleBarView;

@property (weak) IBOutlet NSButtonCell *backButtonCell;
@property (weak) IBOutlet NSButtonCell *forwardButtonCell;
@property (weak) IBOutlet NSButtonCell *refreshButtonCell;
@property (weak) IBOutlet NSButtonCell *linkButtonCell;

@property (strong, readonly) NSString *baseURL;

@property (nonatomic) BOOL loading;

@end

@implementation MainViewController

#pragma mark - Lifecycle

- (void)awakeFromNib {
	INAppStoreWindow *window = (INAppStoreWindow *)self.view.window;
	window.titleBarHeight = self.titleBarView.bounds.size.height;
	
	self.view.wantsLayer = YES;
	self.view.layer.backgroundColor = [NSColor whiteColor].CGColor;
	
	self.titleBarView.frame = window.titleBarView.bounds;
	self.titleBarView.autoresizingMask = NSViewWidthSizable|NSViewHeightSizable;
	[window.titleBarView addSubview:self.titleBarView];
	
	self.loadingView.wantsLayer = YES;
	self.loadingView.layer.masksToBounds = NO;
	
	self.webView.wantsLayer = YES;
	
	self.loadingView.animator.alphaValue = 0.0f;
	self.webView.animator.alphaValue = 0.0f;
	
	dispatch_async(dispatch_get_main_queue(), ^{
		self.loading = YES;
	});
	
	[[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(taskBecameHealthy:) name:MetabaseTaskBecameHealthyNotification object:nil];
	[[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(taskBecameUnhealthy:) name:MetabaseTaskBecameUnhealthyNotification object:nil];
}

- (void)dealloc {
	[[NSNotificationCenter defaultCenter] removeObserver:self];
}


#pragma mark - Notifications

- (void)taskBecameHealthy:(NSNotification *)notification {
	dispatch_async(dispatch_get_main_queue(), ^{
		[self loadMainPage];
		dispatch_async(dispatch_get_main_queue(), ^{
			self.loading = NO;
		});
	});
}

- (void)taskBecameUnhealthy:(NSNotification *)notification {
	dispatch_async(dispatch_get_main_queue(), ^{
		self.loading = YES;
	});
}


#pragma mark - Local Methods

- (void)loadMainPage {
	NSLog(@"Connecting to Metabase instance at: %@", self.baseURL);
	
	NSMutableURLRequest *request = [NSMutableURLRequest requestWithURL:[NSURL URLWithString:self.baseURL]];
	request.cachePolicy = NSURLCacheStorageAllowedInMemoryOnly;
	[self.webView.mainFrame loadRequest:request];
}

- (void)saveCSV:(NSString *)apiURL {
	NSSavePanel *savePanel			= [NSSavePanel savePanel];
	savePanel.allowedFileTypes		= @[@"csv"];
	savePanel.allowsOtherFileTypes	= NO;
	savePanel.extensionHidden		= NO;
	savePanel.showsTagField			= NO;
	
	NSString *downloadsDirectory	=  NSSearchPathForDirectoriesInDomains(NSDownloadsDirectory, NSUserDomainMask, YES)[0];
	savePanel.directoryURL			= [NSURL URLWithString:downloadsDirectory];
	
	NSDateFormatter *dateFormatter	= [[NSDateFormatter alloc] init];
	dateFormatter.locale			= [NSLocale localeWithLocaleIdentifier:@"en_US_POSIX"];
	dateFormatter.dateFormat		= @"yyyy-MM-dd'T'HH_mm_ss";
	savePanel.nameFieldStringValue	= [NSString stringWithFormat:@"query_result_%@", [dateFormatter stringFromDate:[NSDate date]]];
	
	if ([savePanel runModal] == NSFileHandlingPanelOKButton) {
		NSLog(@"Will save CSV at: %@", savePanel.URL);
		
		NSURL *url = [NSURL URLWithString:apiURL relativeToURL:[NSURL URLWithString:self.baseURL]];
		NSURLRequest *csvRequest = [NSURLRequest requestWithURL:url cachePolicy:NSURLRequestReloadIgnoringCacheData timeoutInterval:10.0f];
		[NSURLConnection sendAsynchronousRequest:csvRequest queue:[[NSOperationQueue alloc] init] completionHandler:^(NSURLResponse *response, NSData *data, NSError *connectionError) {
			NSError *writeError = nil;
			[data writeToURL:savePanel.URL options:NSDataWritingAtomic error:&writeError];
			
			dispatch_async(dispatch_get_main_queue(), ^{
				if (writeError) {
					[[NSAlert alertWithError:writeError] runModal];
				} else {
					[[NSAlert alertWithMessageText:@"Saved" defaultButton:@"Done" alternateButton:nil otherButton:nil informativeTextWithFormat:@"Your data has been saved."] runModal];
				}
			});
		}];
	}
}

- (void)injectJS {
	JSContext *context = self.webView.mainFrame.javaScriptContext;
	
	// replace console.log with a function that calls NSLog so we can see the output
	context[@"console"][@"log"] = ^(JSValue *message) {
		NSLog(@"console.log: %@", message);
	};
	
	// custom functions for OS X integration are available to the frontend as properties of window.OSX
	context[@"OSX"] = @{@"saveCSV": ^(JSValue *apiURL){
		[self saveCSV:apiURL.description];
	}};
}


#pragma mark - Getters / Setters

- (NSString *)baseURL {
	return SettingsManager.instance.baseURL.length ? SettingsManager.instance.baseURL : LocalHostBaseURL();
}

- (void)setLoading:(BOOL)loading {
	if (_loading == loading) return;
	_loading = loading;
	
	if (loading) {
		[self.loadingView.layer removeAllAnimations];
		
		self.backButtonCell.enabled = self.forwardButtonCell.enabled = self.linkButtonCell.enabled = NO;
		
		self.webView.animator.alphaValue = 0.2f;
		self.loadingView.animator.alphaValue = 1.0f;
		
		static const CGFloat LoadingViewScaleDuration	= 2.5f;
		static const CGFloat LoadingViewScaleMin		= 0.65f;
		static const CGFloat LoadingViewScaleMax		= 1.0f;
		
		const CATransform3D min = CATransform3DTranslate(CATransform3DMakeScale(LoadingViewScaleMin, LoadingViewScaleMin, 1.0f), self.loadingView.bounds.size.width / 4.0f, self.loadingView.bounds.size.height / 4.0f, 0);
		const CATransform3D max = CATransform3DMakeScale(LoadingViewScaleMax, LoadingViewScaleMax, 1.0f);
		
		CAKeyframeAnimation *scale	= [CAKeyframeAnimation animationWithKeyPath:@"transform"];
		scale.timingFunction		= [CAMediaTimingFunction functionWithName:kCAMediaTimingFunctionEaseInEaseOut];
		scale.values				= @[[NSValue valueWithCATransform3D:min],
										[NSValue valueWithCATransform3D:max],
										[NSValue valueWithCATransform3D:min]];
		scale.duration				= LoadingViewScaleDuration;
		scale.repeatCount			= HUGE_VALF;
		
		[self.loadingView.layer addAnimation:scale forKey:@"transform"];
	} else {
		self.webView.animator.alphaValue = 1.0f;
		self.loadingView.animator.alphaValue = 0.0f;
		
		dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(1.0f * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
			[self.loadingView.layer removeAllAnimations];
		});
	}
}


#pragma mark - Actions

- (IBAction)back:(id)sender {
	[self.webView goBack];
}

- (IBAction)forward:(id)sender {
	[self.webView goForward];
}

- (IBAction)reload:(id)sender {
	[self.webView.mainFrame reload];
}

- (IBAction)copyURLToClipboard:(id)sender {
	[NSPasteboard.generalPasteboard declareTypes:@[NSStringPboardType] owner:nil];
	[NSPasteboard.generalPasteboard setString:self.webView.mainFrameURL forType:NSStringPboardType];
	
	[[NSAlert alertWithMessageText:@"Link Copied" defaultButton:@"Ok" alternateButton:nil otherButton:nil informativeTextWithFormat:@"A link to this page has been copied to your clipboard."] runModal];
}


#pragma mark - WebResourceLoadDelegate

- (void)webView:(WebView *)sender resource:(id)identifier didFinishLoadingFromDataSource:(WebDataSource *)dataSource {
	[self injectJS];
	
	self.linkButtonCell.enabled = YES;
	self.backButtonCell.enabled = self.webView.canGoBack;
	self.forwardButtonCell.enabled = self.webView.canGoForward;
}


#pragma mark - WebPolicyDelegate

- (void)webView:(WebView *)webView decidePolicyForNewWindowAction:(NSDictionary *)actionInformation request:(NSURLRequest *)request newFrameName:(NSString *)frameName decisionListener:(id<WebPolicyDecisionListener>)listener {
	// Tell webkit window to open new links in browser
	NSURL *url = actionInformation[WebActionOriginalURLKey];
	[[NSWorkspace sharedWorkspace] openURL:url];
	[listener ignore];
}

@end
