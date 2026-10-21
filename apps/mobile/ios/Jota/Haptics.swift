import UIKit

@objc(JotaHaptics)
class JotaHaptics: NSObject {
  @objc static func requiresMainQueueSetup() -> Bool { false }

  @objc(impact:resolver:rejecter:)
  func impact(
    _ style: String,
    resolver resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    DispatchQueue.main.async {
      switch style {
      case "medium":
        let generator = UIImpactFeedbackGenerator(style: .medium)
        generator.prepare()
        generator.impactOccurred()
      case "selection":
        let generator = UISelectionFeedbackGenerator()
        generator.prepare()
        generator.selectionChanged()
      case "success":
        let generator = UINotificationFeedbackGenerator()
        generator.prepare()
        generator.notificationOccurred(.success)
      case "error":
        let generator = UINotificationFeedbackGenerator()
        generator.prepare()
        generator.notificationOccurred(.error)
      default:
        let generator = UIImpactFeedbackGenerator(style: .light)
        generator.prepare()
        generator.impactOccurred()
      }
      resolve(nil)
    }
  }
}
