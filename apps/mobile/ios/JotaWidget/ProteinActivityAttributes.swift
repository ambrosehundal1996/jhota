import ActivityKit
import Foundation

struct ProteinActivityAttributes: ActivityAttributes {
  struct ContentState: Codable, Hashable {
    var date: String? = nil
    var total: Int
    var toGoal: Int
    var firstName: String?
    var reached: Bool
    var goalMin: Int
    var goalMax: Int
    var draftGrams: Int?

    var progress: Double {
      guard goalMin > 0 else { return 0 }
      return min(1, Double(total) / Double(goalMin))
    }

    var progressState: WidgetProgressState {
      WidgetProgressState(total: total, toGoal: toGoal, reached: reached, goalMax: goalMax)
    }
  }
}
