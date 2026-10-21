#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(SharedWidgetStore, NSObject)

RCT_EXTERN_METHOD(setSnapshot:(NSString *)json
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

@end
