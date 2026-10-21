#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(JotaHaptics, NSObject)

RCT_EXTERN_METHOD(impact:(NSString *)style
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

@end
