import ActivityKit
import Foundation

struct ProteinActivityAttributes: ActivityAttributes {
  struct ContentState: Codable, Hashable {
    var total: Int
    var toGoal: Int
    var reached: Bool
    var goalMin: Int
    var goalMax: Int

    var progress: Double {
      guard goalMin > 0 else { return 0 }
      return min(1, Double(total) / Double(goalMin))
    }
  }
}
