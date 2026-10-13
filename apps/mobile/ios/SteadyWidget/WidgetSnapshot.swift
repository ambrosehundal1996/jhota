import Foundation

/// Mirrors `WidgetSnapshot` in src/services/widget/widgetBridge.ts.
struct WidgetSnapshot: Codable {
  struct Day: Codable, Hashable {
    let date: String
    let total: Int
    let reached: Bool
  }

  let version: Int
  let date: String
  let total: Int
  let goalMin: Int
  let goalMax: Int
  let toGoal: Int
  let reached: Bool
  let isOverride: Bool
  let week: [Day]
  let updatedAt: String

  static let appGroup = "group.app.steady"
  static let key = "widgetSnapshot"

  static let placeholder = WidgetSnapshot(
    version: 1, date: WidgetSnapshot.localDate(Date()), total: 96, goalMin: 140, goalMax: 200,
    toGoal: 44, reached: false, isOverride: false,
    week: (0..<7).map { Day(date: "", total: [150, 120, 160, 0, 145, 130, 96][$0], reached: [true, false, true, false, true, false, false][$0]) },
    updatedAt: ""
  )

  static func load() -> WidgetSnapshot? {
    guard
      let json = UserDefaults(suiteName: appGroup)?.string(forKey: key),
      let data = json.data(using: .utf8)
    else { return nil }
    return try? JSONDecoder().decode(WidgetSnapshot.self, from: data)
  }

  static func localDate(_ date: Date) -> String {
    let formatter = DateFormatter()
    formatter.calendar = Calendar(identifier: .gregorian)
    formatter.locale = Locale(identifier: "en_US_POSIX")
    formatter.dateFormat = "yyyy-MM-dd"
    return formatter.string(from: date)
  }

  /// A snapshot written on an earlier day shows today as a fresh 0g day.
  func resolved(for now: Date) -> WidgetSnapshot {
    let today = WidgetSnapshot.localDate(now)
    guard date != today else { return self }
    let shiftedWeek = Array((week + [Day(date: today, total: 0, reached: false)]).suffix(7))
    return WidgetSnapshot(
      version: version, date: today, total: 0, goalMin: goalMin, goalMax: goalMax,
      toGoal: goalMin, reached: false, isOverride: false, week: shiftedWeek, updatedAt: updatedAt
    )
  }

  var progress: Double {
    guard goalMin > 0 else { return 0 }
    return min(1, Double(total) / Double(goalMin))
  }
}
