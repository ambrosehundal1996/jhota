import ActivityKit
import AppIntents
import SwiftUI
import WidgetKit

private let accent = Color(red: 0x1E / 255, green: 0x9E / 255, blue: 0x4A / 255)
private let ink = Color(red: 0x12 / 255, green: 0x18 / 255, blue: 0x14 / 255)
private let muted = Color(red: 0xA8 / 255, green: 0xB5 / 255, blue: 0xAC / 255)
private let track = Color.white.opacity(0.16)

private func link(_ path: String) -> URL {
  URL(string: "jota://\(path)?src=widget")!
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
    let snapshot = WidgetSnapshot.load()?.resolved(for: now) ?? .placeholder
    completion(JotaEntry(date: now, snapshot: snapshot, isPlaceholder: WidgetSnapshot.load() == nil))
  }

  func getTimeline(in context: Context, completion: @escaping (Timeline<JotaEntry>) -> Void) {
    let now = Date()
    let stored = WidgetSnapshot.load()
    let current = JotaEntry(date: now, snapshot: stored?.resolved(for: now) ?? .placeholder, isPlaceholder: stored == nil)
    let midnight = Calendar.current.startOfDay(for: now.addingTimeInterval(86_400))
    var entries = [current]
    if let stored {
      entries.append(JotaEntry(date: midnight, snapshot: stored.resolved(for: midnight), isPlaceholder: false))
    }
    completion(Timeline(entries: entries, policy: .after(midnight.addingTimeInterval(60))))
  }
}

// MARK: - Pieces

struct SnapButton: View {
  var size: CGFloat = 52

  var body: some View {
    Link(destination: link("log/photo")) {
      Image(systemName: "camera.fill")
        .font(.system(size: size * 0.38, weight: .semibold))
        .foregroundStyle(.white)
        .frame(width: size, height: size)
        .background(Circle().fill(accent))
    }
    .buttonStyle(.plain)
    .accessibilityLabel("Snap meal")
  }
}

struct RemainingHero: View {
  let snapshot: WidgetSnapshot
  var numberSize: CGFloat = 44
  var alignment: HorizontalAlignment = .center

  var body: some View {
    VStack(alignment: alignment, spacing: 2) {
      if snapshot.reached {
        Text("Done")
          .font(.system(size: numberSize, weight: .bold, design: .rounded))
          .foregroundStyle(.white)
          .minimumScaleFactor(0.6)
          .lineLimit(1)
        Text("\(snapshot.total)g · goal reached")
          .font(.system(size: 13, weight: .medium))
          .foregroundStyle(muted)
      } else {
        Text("\(snapshot.toGoal)")
          .font(.system(size: numberSize, weight: .bold, design: .rounded))
          .foregroundStyle(.white)
          .minimumScaleFactor(0.5)
          .lineLimit(1)
          .accessibilityLabel("\(snapshot.toGoal) grams left")
        Text("g left")
          .font(.system(size: 13, weight: .semibold))
          .foregroundStyle(muted)
      }
    }
  }
}

struct RemainingBar: View {
  let snapshot: WidgetSnapshot

  var body: some View {
    GeometryReader { geo in
      ZStack(alignment: .leading) {
        Capsule().fill(track)
        Capsule()
          .fill(accent)
          .frame(width: max(6, geo.size.width * snapshot.progress))
      }
    }
    .frame(height: 6)
  }
}

struct WeekDots: View {
  let snapshot: WidgetSnapshot

  var body: some View {
    HStack(spacing: 8) {
      ForEach(Array(snapshot.week.enumerated()), id: \.offset) { _, day in
        Circle()
          .fill(day.reached ? accent : (day.total > 0 ? Color.white.opacity(0.35) : track))
          .frame(width: 8, height: 8)
          .accessibilityLabel(day.reached ? "Goal reached" : "\(day.total) grams")
      }
    }
  }
}

private extension View {
  func jotaOpaqueBackground() -> some View {
    containerBackground(for: .widget) { ink }
  }
}

// MARK: - Families

struct JotaWidgetView: View {
  @Environment(\.widgetFamily) private var family
  let entry: JotaEntry

  var body: some View {
    let s = entry.snapshot
    switch family {
    case .accessoryCircular:
      ZStack {
        Circle().fill(accent)
        Image(systemName: "camera.fill")
          .font(.system(size: 18, weight: .bold))
          .foregroundStyle(.white)
      }
      .widgetURL(link("log/photo"))
      .accessibilityLabel("Snap meal")

    case .accessoryRectangular:
      HStack(spacing: 10) {
        ZStack {
          Circle().fill(accent)
          Image(systemName: "camera.fill")
            .font(.system(size: 13, weight: .bold))
            .foregroundStyle(.white)
        }
        .frame(width: 28, height: 28)
        VStack(alignment: .leading, spacing: 1) {
          Text(s.reached ? "Goal reached" : "\(s.toGoal)g left")
            .font(.headline)
            .foregroundStyle(.white)
          Text("Snap a meal")
            .font(.caption2)
            .foregroundStyle(.white.opacity(0.8))
        }
        Spacer(minLength: 0)
      }
      .widgetURL(link("log/photo"))

    case .accessoryInline:
      Text(s.reached ? "Jota · goal reached" : "Jota · \(s.toGoal)g left")
        .widgetURL(link("log/photo"))

    case .systemMedium:
      HStack(alignment: .center, spacing: 16) {
        VStack(alignment: .leading, spacing: 10) {
          RemainingHero(snapshot: s, numberSize: 48, alignment: .leading)
          RemainingBar(snapshot: s)
          Text("Goal \(s.goalMin)–\(s.goalMax)g")
            .font(.caption)
            .foregroundStyle(muted)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        VStack(spacing: 8) {
          SnapButton(size: 64)
          Text("Snap")
            .font(.caption.weight(.semibold))
            .foregroundStyle(.white)
        }
      }
      .frame(maxWidth: .infinity, maxHeight: .infinity)
      .padding(16)
      .widgetURL(link("today"))

    case .systemLarge:
      VStack(alignment: .leading, spacing: 18) {
        HStack(alignment: .center) {
          RemainingHero(snapshot: s, numberSize: 56, alignment: .leading)
          Spacer()
          VStack(spacing: 8) {
            SnapButton(size: 64)
            Text("Snap")
              .font(.caption.weight(.semibold))
              .foregroundStyle(.white)
          }
        }
        RemainingBar(snapshot: s)
        HStack {
          Text("Goal \(s.goalMin)–\(s.goalMax)g")
            .font(.caption)
            .foregroundStyle(muted)
          Spacer()
          WeekDots(snapshot: s)
        }
        Spacer(minLength: 0)
        HStack(spacing: 8) {
          Link(destination: link("log/quick-add")) {
            Label("Quick add", systemImage: "bolt.fill")
              .font(.caption.weight(.semibold))
              .foregroundStyle(.white)
              .frame(maxWidth: .infinity, minHeight: 40)
              .background(Capsule().fill(Color.white.opacity(0.12)))
          }
          Link(destination: link("log/search")) {
            Label("Search", systemImage: "magnifyingglass")
              .font(.caption.weight(.semibold))
              .foregroundStyle(.white)
              .frame(maxWidth: .infinity, minHeight: 40)
              .background(Capsule().fill(Color.white.opacity(0.12)))
          }
        }
      }
      .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
      .padding(16)
      .widgetURL(link("today"))

    default:
      VStack(spacing: 0) {
        Spacer(minLength: 0)
        RemainingHero(snapshot: s, numberSize: 42, alignment: .center)
          .frame(maxWidth: .infinity)
        Spacer(minLength: 8)
        SnapButton(size: 52)
      }
      .frame(maxWidth: .infinity, maxHeight: .infinity)
      .padding(.horizontal, 14)
      .padding(.top, 12)
      .padding(.bottom, 14)
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
    .configurationDisplayName("Protein left")
    .description("See how much protein you have left, and snap a meal in one tap.")
    .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
    .contentMarginsDisabled()
    .containerBackgroundRemovable(false)
  }
}

struct JotaLockScreenWidget: Widget {
  let kind = "JotaLockScreenWidget"

  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: JotaProvider()) { entry in
      JotaWidgetView(entry: entry)
        .redacted(reason: entry.isPlaceholder ? .placeholder : [])
    }
    .configurationDisplayName("Snap meal")
    .description("Snap a meal from the Lock Screen.")
    .supportedFamilies([.accessoryCircular, .accessoryRectangular, .accessoryInline])
  }
}

// MARK: - Lock screen Live Activity (Spotify-style card)

struct ProteinLiveActivity: Widget {
  var body: some WidgetConfiguration {
    ActivityConfiguration(for: ProteinActivityAttributes.self) { context in
      HStack(spacing: 14) {
        VStack(alignment: .leading, spacing: 6) {
          Text(context.state.reached ? "Goal reached" : "\(context.state.toGoal)g left")
            .font(.system(size: 22, weight: .bold, design: .rounded))
            .foregroundStyle(.white)
          Text(context.state.reached ? "\(context.state.total)g today" : "protein still to eat")
            .font(.subheadline.weight(.medium))
            .foregroundStyle(muted)
          RemainingBar(snapshot: barSnapshot(context.state))
            .padding(.top, 4)
        }
        Spacer(minLength: 8)
        Link(destination: link("log/photo")) {
          Image(systemName: "camera.fill")
            .font(.system(size: 22, weight: .semibold))
            .foregroundStyle(.white)
            .frame(width: 56, height: 56)
            .background(Circle().fill(accent))
        }
      }
      .padding(.horizontal, 20)
      .padding(.vertical, 16)
      .activityBackgroundTint(ink)
      .activitySystemActionForegroundColor(.white)
      .widgetURL(link("today"))
    } dynamicIsland: { context in
      DynamicIsland {
        DynamicIslandExpandedRegion(.leading) {
          Text(context.state.reached ? "Done" : "\(context.state.toGoal)g")
            .font(.title2.bold())
        }
        DynamicIslandExpandedRegion(.trailing) {
          Image(systemName: "camera.fill")
            .foregroundStyle(accent)
        }
        DynamicIslandExpandedRegion(.bottom) {
          Text(context.state.reached ? "Goal reached" : "protein left today")
            .font(.caption)
            .foregroundStyle(.secondary)
        }
      } compactLeading: {
        Image(systemName: "camera.fill")
      } compactTrailing: {
        Text(context.state.reached ? "✓" : "\(context.state.toGoal)g")
          .font(.caption.weight(.bold))
      } minimal: {
        Text(context.state.reached ? "✓" : "\(context.state.toGoal)")
          .font(.caption2.weight(.bold))
      }
      .widgetURL(link("log/photo"))
    }
  }

  private func barSnapshot(_ state: ProteinActivityAttributes.ContentState) -> WidgetSnapshot {
    WidgetSnapshot(
      version: 1, date: "", total: state.total, goalMin: state.goalMin, goalMax: state.goalMax,
      toGoal: state.toGoal, reached: state.reached, isOverride: false, week: [], updatedAt: ""
    )
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
    JotaLockScreenWidget()
    ProteinLiveActivity()
    if #available(iOS 18.0, *) {
      SnapMealControl()
    }
  }
}
