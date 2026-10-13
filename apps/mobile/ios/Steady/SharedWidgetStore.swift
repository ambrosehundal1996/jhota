import Foundation
import WidgetKit

/// Writes the widget snapshot JSON into the shared App Group and refreshes widget timelines.
@objc(SharedWidgetStore)
class SharedWidgetStore: NSObject {
  static let appGroup = "group.app.steady"
  static let snapshotKey = "widgetSnapshot"

  @objc static func requiresMainQueueSetup() -> Bool { false }

  @objc(setSnapshot:resolver:rejecter:)
  func setSnapshot(
    _ json: String,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    guard let defaults = UserDefaults(suiteName: Self.appGroup) else {
      reject("no_app_group", "App Group \(Self.appGroup) is not configured", nil)
      return
    }
    defaults.set(json, forKey: Self.snapshotKey)
    WidgetCenter.shared.reloadAllTimelines()
    resolve(nil)
  }
}
