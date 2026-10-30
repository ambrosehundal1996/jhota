import AppIntents
import SwiftUI
import WidgetKit

private let forest = Color(red: 0x10 / 255, green: 0x3B / 255, blue: 0x2D / 255)
private let cream = Color(red: 0xF7 / 255, green: 0xF8 / 255, blue: 0xF3 / 255)
private let lime = Color(red: 0xB7 / 255, green: 0xEC / 255, blue: 0x92 / 255)
private let muted = cream.opacity(0.64)
private let track = Color.white.opacity(0.14)

private func link(_ path: String) -> URL {
  URL(string: "jota://\(path)?src=widget")!
}

private func goalRangeCopy(_ snapshot: WidgetSnapshot) -> String {
  "Goal \(snapshot.goalMin)–\(snapshot.goalMax)g"
}

// MARK: - Timeline

struct JotaEntry: TimelineEntry {
  let date: Date
  let snapshot: WidgetSnapshot
  let isPlaceholder: Bool
}

struct JotaProvider: TimelineProvider {
  func placeholder(in context: Context) -> JotaEntry {
    JotaEntry(date: Date(), snapshot: .placeholder, isPlaceholder: true)
  }

  func getSnapshot(in context: Context, completion: @escaping (JotaEntry) -> Void) {
    let now = Date()
    completion(
      JotaEntry(
        date: now,
        snapshot: WidgetSnapshot.load()?.resolved(for: now) ?? .placeholder,
        isPlaceholder: WidgetSnapshot.load() == nil
      )
    )
  }

  func getTimeline(in context: Context, completion: @escaping (Timeline<JotaEntry>) -> Void) {
    let now = Date()
    let stored = WidgetSnapshot.load()
    let current = JotaEntry(
      date: now,
      snapshot: stored?.resolved(for: now) ?? .placeholder,
      isPlaceholder: stored == nil
    )
    let midnight = Calendar.current.startOfDay(for: now.addingTimeInterval(86_400))
    var entries = [current]
    if let stored {
      entries.append(
        JotaEntry(date: midnight, snapshot: stored.resolved(for: midnight), isPlaceholder: false)
      )
    }
    completion(Timeline(entries: entries, policy: .after(midnight.addingTimeInterval(60))))
  }
}

// MARK: - Pieces

struct ProgressHeader: View {
  let state: WidgetProgressState
  let total: Int
  let goalMin: Int
  let goalMax: Int
  var numberSize: CGFloat = 28

  var body: some View {
    VStack(alignment: .leading, spacing: 3) {
      Text(state.headline)
        .font(.system(size: headlineSize, weight: .bold, design: .rounded))
        .foregroundStyle(headlineColor)
        .minimumScaleFactor(0.55)
        .lineLimit(1)
      Text(state.supporting(total: total, goalMin: goalMin, goalMax: goalMax))
        .font(.system(size: 13, weight: .medium))
        .foregroundStyle(muted)
        .lineLimit(1)
        .minimumScaleFactor(0.75)
    }
    .accessibilityElement(children: .ignore)
    .accessibilityLabel(state.accessibilityLabel(total: total, goalMin: goalMin, goalMax: goalMax))
  }

  private var headlineSize: CGFloat {
    switch state {
    case .getStarted: return min(18, numberSize * 0.68)
    case .almostThere: return min(22, numberSize * 0.82)
    default: return numberSize
    }
  }

  private var headlineColor: Color {
    state.celebrates ? lime : cream
  }
}

struct RangeBar: View {
  let snapshot: WidgetSnapshot
  var height: CGFloat = 8

  var body: some View {
    let layout = snapshot.rangeLayout
    GeometryReader { geo in
      let w = geo.size.width
      ZStack(alignment: .leading) {
        ZStack(alignment: .leading) {
          Capsule().fill(track)
          Capsule()
            .fill(lime.opacity(0.28))
            .frame(width: max(4, (layout.maxEnd - layout.minStart) * w))
            .offset(x: layout.minStart * w)
          if snapshot.total > 0 {
            Capsule()
              .fill(lime)
              .frame(width: max(6, min(w, layout.current * w)))
          }
        }
        .clipShape(Capsule())
        tick(at: layout.minStart * w, height: height)
        tick(at: layout.maxEnd * w, height: height)
      }
    }
    .frame(height: height)
    .accessibilityHidden(true)
  }

  private func tick(at x: CGFloat, height: CGFloat) -> some View {
    Capsule()
      .fill(lime)
      .frame(width: 2, height: height + 4)
      .offset(x: max(0, x - 1))
  }
}

struct SnapButton: View {
  var size: CGFloat = 40

  var body: some View {
    Link(destination: link("log/photo")) {
      Image(systemName: "camera.fill")
        .font(.system(size: size * 0.38, weight: .semibold))
        .foregroundStyle(forest)
        .frame(width: size, height: size)
        .background(Circle().fill(lime))
    }
    .buttonStyle(.plain)
    .accessibilityLabel("Snap meal")
  }
}

struct QuickLogRow: View {
  var compact: Bool = false

  var body: some View {
    HStack(spacing: compact ? 6 : 8) {
      Button(intent: LogQuickAddIntent(grams: 20)) { addLabel(20) }
        .buttonStyle(.plain)
        .accessibilityLabel("Add 20 grams of protein")
      Button(intent: LogQuickAddIntent(grams: 30)) { addLabel(30) }
        .buttonStyle(.plain)
        .accessibilityLabel("Add 30 grams of protein")
      Link(destination: link("log/quick-add")) {
        customLabel
      }
      .buttonStyle(.plain)
      .accessibilityLabel("Custom protein amount")
    }
  }

  private func addLabel(_ grams: Int) -> some View {
    Text("+\(grams)g")
      .font(.system(size: compact ? 12 : 13, weight: .heavy, design: .rounded))
      .foregroundStyle(forest)
      .frame(maxWidth: .infinity, minHeight: compact ? 32 : 40)
      .background(Capsule().fill(lime))
  }

  private var customLabel: some View {
    Text("Custom +")
      .font(.system(size: compact ? 12 : 13, weight: .semibold, design: .rounded))
      .foregroundStyle(cream)
      .frame(maxWidth: .infinity, minHeight: compact ? 32 : 40)
      .background(
        Capsule()
          .fill(Color.white.opacity(0.08))
          .overlay(Capsule().stroke(cream.opacity(0.28), lineWidth: 1))
      )
  }
}

struct WeekDots: View {
  let snapshot: WidgetSnapshot

  var body: some View {
    HStack(spacing: 8) {
      ForEach(Array(snapshot.week.enumerated()), id: \.offset) { _, day in
        Circle()
          .fill(day.reached ? lime : (day.total > 0 ? cream.opacity(0.4) : track))
          .frame(width: 8, height: 8)
          .accessibilityLabel(day.reached ? "Goal reached" : "\(day.total) grams")
      }
    }
  }
}

private extension View {
  func jotaOpaqueBackground() -> some View {
    containerBackground(for: .widget) { forest }
  }
}

// MARK: - Families

struct JotaWidgetView: View {
  @Environment(\.widgetFamily) private var family
  let entry: JotaEntry

  var body: some View {
    let s = entry.snapshot
    let state = s.progressState
    switch family {
    case .systemMedium:
      VStack(alignment: .leading, spacing: 10) {
        HStack(alignment: .top, spacing: 12) {
          ProgressHeader(
            state: state,
            total: s.total,
            goalMin: s.goalMin,
            goalMax: s.goalMax,
            numberSize: 30
          )
          Spacer(minLength: 8)
          SnapButton(size: 40)
        }
        RangeBar(snapshot: s)
        QuickLogRow()
      }
      .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
      .padding(16)
      .widgetURL(link("today"))

    case .systemLarge:
      VStack(alignment: .leading, spacing: 16) {
        HStack(alignment: .top, spacing: 12) {
          ProgressHeader(
            state: state,
            total: s.total,
            goalMin: s.goalMin,
            goalMax: s.goalMax,
            numberSize: 36
          )
          Spacer(minLength: 8)
          SnapButton(size: 44)
        }
        RangeBar(snapshot: s, height: 10)
        HStack {
          Text(goalRangeCopy(s))
            .font(.caption)
            .foregroundStyle(muted)
          Spacer()
          WeekDots(snapshot: s)
        }
        QuickLogRow()
        Spacer(minLength: 0)
      }
      .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
      .padding(16)
      .widgetURL(link("today"))

    default:
      VStack(alignment: .leading, spacing: 8) {
        HStack(alignment: .top) {
          ProgressHeader(
            state: state,
            total: s.total,
            goalMin: s.goalMin,
            goalMax: s.goalMax,
            numberSize: 22
          )
          Spacer(minLength: 4)
          SnapButton(size: 34)
        }
        RangeBar(snapshot: s, height: 6)
        Spacer(minLength: 0)
        QuickLogRow(compact: true)
      }
      .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
      .padding(14)
      .widgetURL(link("today"))
    }
  }
}

struct JotaWidget: Widget {
  let kind = "JotaWidget"

  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: JotaProvider()) { entry in
      JotaWidgetView(entry: entry)
        .jotaOpaqueBackground()
        .redacted(reason: entry.isPlaceholder ? .placeholder : [])
    }
    .configurationDisplayName("Protein to go")
    .description("See remaining protein, add 20g or 30g, or snap a meal.")
    .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
    .contentMarginsDisabled()
    .containerBackgroundRemovable(false)
  }
}

// MARK: - Lock Screen / Control Center camera (iOS 18+)

@available(iOS 18.0, *)
struct SnapMealIntent: AppIntent {
  static var title: LocalizedStringResource = "Snap meal"
  static var description = IntentDescription("Photograph a meal to log protein.")
  static var openAppWhenRun = true

  func perform() async throws -> some IntentResult & OpensIntent {
    .result(opensIntent: OpenURLIntent(link("log/photo")))
  }
}

@available(iOS 18.0, *)
struct SnapMealControl: ControlWidget {
  static let kind = "app.jota.control.snapMeal"

  var body: some ControlWidgetConfiguration {
    StaticControlConfiguration(kind: Self.kind) {
      ControlWidgetButton(action: SnapMealIntent()) {
        Label("Snap meal", systemImage: "camera.fill")
      }
    }
    .displayName("Snap meal")
    .description("Open the camera to photograph a meal.")
  }
}

@main
struct JotaWidgetBundle: WidgetBundle {
  var body: some Widget {
    JotaWidget()
    if #available(iOS 18.0, *) {
      SnapMealControl()
    }
  }
}
