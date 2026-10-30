import ActivityKit
import AppIntents
import Foundation
import WidgetKit

struct PendingQuickAdd: Codable {
  let id: String
  let grams: Int
  let date: String
  let loggedAt: String
}

/// App Group pending logs so Lock Screen / widget buttons can quick-add
/// without opening the React Native UI.
enum WidgetQuickAdd {
  static let pendingKey = "pendingQuickAdds"
  static let lastLogAtKey = "quickAddLastLogAt"
  static let lastLogGramsKey = "quickAddLastLogGrams"
  static let presets = [20, 30]
  static let debounce: TimeInterval = 0.45

  private static var defaults: UserDefaults? {
    UserDefaults(suiteName: WidgetSnapshot.appGroup)
  }

  /// One-tap log. Returns 0 when storage is missing or the tap is a bounce.
  @discardableResult
  static func logGrams(_ grams: Int, now: Date = Date()) -> Int {
    let amount = min(500, max(1, grams))
    guard let defaults else { return 0 }
    let lastAt = defaults.object(forKey: lastLogAtKey) as? TimeInterval
    let lastGrams = defaults.object(forKey: lastLogGramsKey) as? Int
    if let lastAt, lastGrams == amount, now.timeIntervalSince1970 - lastAt < debounce {
      return 0
    }

    let iso = ISO8601DateFormatter()
    iso.formatOptions = [.withInternetDateTime]
    let pending = PendingQuickAdd(
      id: UUID().uuidString.lowercased(),
      grams: amount,
      date: WidgetSnapshot.localDate(now),
      loggedAt: iso.string(from: now)
    )
    var queue = loadPending()
    queue.append(pending)
    savePending(queue)
    defaults.set(now.timeIntervalSince1970, forKey: lastLogAtKey)
    defaults.set(amount, forKey: lastLogGramsKey)

    if var snapshot = WidgetSnapshot.load()?.resolved(for: now) {
      snapshot = snapshot.applyingQuickAdd(amount, now: now)
      snapshot.save()
      snapshot.pushLiveActivity()
    }
    WidgetCenter.shared.reloadAllTimelines()
    return amount
  }

  static func takePending() -> [PendingQuickAdd] {
    let pending = loadPending()
    savePending([])
    return pending
  }

  private static func loadPending() -> [PendingQuickAdd] {
    guard let data = defaults?.data(forKey: pendingKey) else { return [] }
    return (try? JSONDecoder().decode([PendingQuickAdd].self, from: data)) ?? []
  }

  private static func savePending(_ pending: [PendingQuickAdd]) {
    let data = (try? JSONEncoder().encode(pending)) ?? Data()
    defaults?.set(data, forKey: pendingKey)
  }
}

struct LogQuickAddIntent: AppIntent {
  static var title: LocalizedStringResource = "Log protein"
  static var description = IntentDescription("Add protein grams from the widget.")
  static var isDiscoverable = false
  static var openAppWhenRun = false

  @Parameter(title: "Grams")
  var grams: Int

  init() { grams = WidgetQuickAdd.presets[0] }
  init(grams: Int) { self.grams = grams }

  func perform() async throws -> some IntentResult {
    WidgetQuickAdd.logGrams(grams)
    return .result()
  }
}

struct LogQuickAddLiveIntent: LiveActivityIntent {
  static var title: LocalizedStringResource = "Log protein"
  static var openAppWhenRun = false

  @Parameter(title: "Grams")
  var grams: Int

  init() { grams = WidgetQuickAdd.presets[0] }
  init(grams: Int) { self.grams = grams }

  func perform() async throws -> some IntentResult {
    WidgetQuickAdd.logGrams(grams)
    return .result()
  }
}
