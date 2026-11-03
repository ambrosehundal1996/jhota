import ActivityKit
import Foundation
import WidgetKit

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
  let firstName: String?
  let reached: Bool
  let isOverride: Bool
  let week: [Day]
  let updatedAt: String

  static let appGroup = "group.app.jota"
  static let key = "widgetSnapshot"

  static let placeholder = WidgetSnapshot(
    version: 1, date: WidgetSnapshot.localDate(Date()), total: 96, goalMin: 140, goalMax: 200,
    toGoal: 44, firstName: "Alex", reached: false, isOverride: false,
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
    var calendar = Calendar(identifier: .gregorian)
    calendar.timeZone = TimeZone.current
    let parts = calendar.dateComponents([.year, .month, .day], from: date)
    return String(format: "%04d-%02d-%02d", parts.year ?? 1970, parts.month ?? 1, parts.day ?? 1)
  }

  static func startOfNextDay(after date: Date = Date()) -> Date {
    let calendar = Calendar.current
    let start = calendar.startOfDay(for: date)
    return calendar.date(byAdding: .day, value: 1, to: start) ?? start.addingTimeInterval(86_400)
  }

  /// A snapshot written on an earlier day shows today as a fresh 0g day.
  func resolved(for now: Date) -> WidgetSnapshot {
    let today = WidgetSnapshot.localDate(now)
    guard date != today else { return self }
    let shiftedWeek = Array((week + [Day(date: today, total: 0, reached: false)]).suffix(7))
    return WidgetSnapshot(
      version: version, date: today, total: 0, goalMin: goalMin, goalMax: goalMax,
      toGoal: goalMin, firstName: firstName, reached: false, isOverride: false, week: shiftedWeek, updatedAt: updatedAt
    )
  }

  var progress: Double {
    guard goalMin > 0 else { return 0 }
    return min(1, Double(total) / Double(goalMin))
  }

  /// Matches `rangeBarLayout` in packages/domain so the widget bar and Today agree.
  var rangeLayout: RangeLayout {
    let minG = max(0, goalMin)
    let maxG = max(minG, goalMax)
    let consumed = max(0, total)
    let span = max(Double(maxG - minG), 1)
    let headroom = max(span * 0.35, Double(maxG) * 0.15, 20)
    let scaleMax = max(Double(maxG) + headroom, Double(consumed), 1)
    let zoneEnd = maxG <= minG ? min(1, (Double(minG) + span * 0.04) / scaleMax) : Double(maxG) / scaleMax
    return RangeLayout(
      minStart: Double(minG) / scaleMax,
      maxEnd: zoneEnd,
      current: min(1, Double(consumed) / scaleMax)
    )
  }

  var progressState: WidgetProgressState {
    WidgetProgressState(total: total, toGoal: toGoal, reached: reached, goalMax: goalMax)
  }

  struct RangeLayout {
    let minStart: Double
    let maxEnd: Double
    let current: Double
  }

  func applyingQuickAdd(_ grams: Int, now: Date = Date()) -> WidgetSnapshot {
    let resolved = resolved(for: now)
    if resolved.isOverride { return resolved }
    let total = resolved.total + max(0, grams)
    let reached = resolved.goalMin > 0 && total >= resolved.goalMin
    let toGoal = reached ? 0 : max(0, resolved.goalMin - total)
    let week = resolved.week.enumerated().map { index, day in
      let isToday = day.date == resolved.date || (day.date.isEmpty && index == resolved.week.count - 1)
      guard isToday else { return day }
      return Day(date: resolved.date, total: total, reached: reached)
    }
    return WidgetSnapshot(
      version: resolved.version, date: resolved.date, total: total, goalMin: resolved.goalMin, goalMax: resolved.goalMax,
      toGoal: toGoal, firstName: resolved.firstName, reached: reached, isOverride: false, week: week,
      updatedAt: ISO8601DateFormatter().string(from: now)
    )
  }

  func save() {
    guard let data = try? JSONEncoder().encode(self),
          let json = String(data: data, encoding: .utf8)
    else { return }
    UserDefaults(suiteName: Self.appGroup)?.set(json, forKey: Self.key)
  }

  /// No-op inside the widget extension; Live Activities belong to the app process.
  func pushLiveActivity() {
    guard Bundle.main.bundleIdentifier?.hasSuffix(".widget") != true else { return }
    WidgetLiveActivity.push(self)
  }
}

/// Widget / Live Activity headline. Remaining is always vs the goal minimum.
enum WidgetProgressState: Equatable {
  case getStarted
  case remaining(left: Int)
  case almostThere(left: Int)
  case goalHit
  case aboveMax(total: Int)

  init(total: Int, toGoal: Int, reached: Bool, goalMax: Int) {
    if total <= 0 {
      self = .getStarted
    } else if reached {
      self = total > goalMax ? .aboveMax(total: total) : .goalHit
    } else if toGoal <= 10 {
      self = .almostThere(left: toGoal)
    } else {
      self = .remaining(left: toGoal)
    }
  }

  var headline: String {
    switch self {
    case .getStarted: return "LET'S GET STARTED"
    case .remaining(let left): return "\(left)g LEFT"
    case .almostThere: return "ALMOST THERE!"
    case .goalHit: return "GOAL HIT ✓"
    case .aboveMax(let total): return "\(total)g TODAY ✓"
    }
  }

  func supporting(total: Int, goalMin: Int, goalMax: Int) -> String {
    let range = "Goal \(goalMin)–\(goalMax)g"
    switch self {
    case .getStarted:
      return "0g today · \(range)"
    case .remaining:
      return "\(total)g today · \(range)"
    case .almostThere(let left):
      return "\(left)g left · \(total)g today · \(range)"
    case .goalHit:
      return "\(total)g today · \(range)"
    case .aboveMax:
      return range
    }
  }

  func accessibilityLabel(total: Int, goalMin: Int, goalMax: Int) -> String {
    switch self {
    case .getStarted:
      return "Let's get started. 0 grams today. Goal \(goalMin) to \(goalMax) grams."
    case .remaining(let left):
      return "\(left) grams left. \(total) grams today. Goal \(goalMin) to \(goalMax) grams."
    case .almostThere(let left):
      return "Almost there. \(left) grams left. \(total) grams today. Goal \(goalMin) to \(goalMax) grams."
    case .goalHit:
      return "Goal hit. \(total) grams today. Goal \(goalMin) to \(goalMax) grams."
    case .aboveMax(let amount):
      return "\(amount) grams today. Goal hit. Goal \(goalMin) to \(goalMax) grams."
    }
  }

  var celebrates: Bool {
    switch self {
    case .goalHit, .aboveMax: return true
    default: return false
    }
  }
}

enum WidgetLiveActivity {
  /// Re-pushes today's resolved snapshot. The lock-screen Live Activity is a frozen
  /// banner — WidgetKit's midnight timeline does not update it.
  static func refreshForToday() {
    guard Bundle.main.bundleIdentifier?.hasSuffix(".widget") != true else { return }
    guard let stored = WidgetSnapshot.load() else { return }
    push(stored)
  }

  static func push(_ snapshot: WidgetSnapshot) {
    guard Bundle.main.bundleIdentifier?.hasSuffix(".widget") != true else { return }
    guard ActivityAuthorizationInfo().areActivitiesEnabled else { return }
    let resolved = snapshot.resolved(for: Date())
    if resolved.date != snapshot.date {
      resolved.save()
      WidgetCenter.shared.reloadAllTimelines()
    }
    let state = ProteinActivityAttributes.ContentState(
      date: resolved.date,
      total: resolved.total,
      toGoal: resolved.toGoal,
      firstName: resolved.firstName,
      reached: resolved.reached,
      goalMin: resolved.goalMin,
      goalMax: resolved.goalMax,
      draftGrams: nil
    )
    let content = ActivityContent(state: state, staleDate: WidgetSnapshot.startOfNextDay())
    Task { @MainActor in
      do {
        if let activity = Activity<ProteinActivityAttributes>.activities.first {
          await activity.update(content)
        } else {
          _ = try Activity.request(
            attributes: ProteinActivityAttributes(),
            content: content,
            pushType: nil
          )
        }
      } catch {
        #if DEBUG
        print("[widget] live activity failed:", error)
        #endif
      }
    }
  }

  static func push(json: String) {
    guard let data = json.data(using: .utf8),
          let snapshot = try? JSONDecoder().decode(WidgetSnapshot.self, from: data)
    else { return }
    push(snapshot)
  }

  static func endAll() {
    let activities = Activity<ProteinActivityAttributes>.activities
    guard !activities.isEmpty else { return }
    Task { @MainActor in
      for activity in activities {
        await activity.end(nil, dismissalPolicy: .immediate)
      }
    }
  }
}
