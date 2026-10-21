import ActivityKit
import Foundation
import WidgetKit

/// Writes the widget snapshot JSON into the shared App Group and refreshes widget timelines.
@objc(SharedWidgetStore)
class SharedWidgetStore: NSObject {
  static let appGroup = "group.app.jota"
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
    Self.syncLiveActivity(json: json)
    resolve(nil)
  }

  private static func syncLiveActivity(json: String) {
    guard ActivityAuthorizationInfo().areActivitiesEnabled else { return }
    guard let data = json.data(using: .utf8),
          let snapshot = try? JSONDecoder().decode(WidgetSnapshot.self, from: data)
    else { return }
    let resolved = snapshot.resolved(for: Date())
    let state = ProteinActivityAttributes.ContentState(
      total: resolved.total,
      toGoal: resolved.toGoal,
      reached: resolved.reached,
      goalMin: resolved.goalMin,
      goalMax: resolved.goalMax
    )
    let midnight = Calendar.current.startOfDay(for: Date().addingTimeInterval(86_400))
    let content = ActivityContent(state: state, staleDate: midnight)
    Task { @MainActor in
      if let activity = Activity<ProteinActivityAttributes>.activities.first {
        await activity.update(content)
      } else {
        _ = try? Activity.request(
          attributes: ProteinActivityAttributes(),
          content: content,
          pushType: nil
        )
      }
    }
  }
}
