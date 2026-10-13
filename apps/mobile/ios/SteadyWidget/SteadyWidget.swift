import SwiftUI
import WidgetKit

private let accent = Color(red: 0x1E / 255, green: 0x9E / 255, blue: 0x4A / 255)
private let accentText = Color(red: 0x16 / 255, green: 0x7A / 255, blue: 0x3A / 255)
private let track = Color(red: 0xE4 / 255, green: 0xF4 / 255, blue: 0xE9 / 255)
private let neutralBar = Color(red: 0xC9 / 255, green: 0xD1 / 255, blue: 0xCC / 255)

private func link(_ path: String) -> URL {
  URL(string: "steady://\(path)?src=widget")!
}

// MARK: - Timeline

struct SteadyEntry: TimelineEntry {
  let date: Date
  let snapshot: WidgetSnapshot
  let isPlaceholder: Bool
}

struct SteadyProvider: TimelineProvider {
  func placeholder(in context: Context) -> SteadyEntry {
    SteadyEntry(date: Date(), snapshot: .placeholder, isPlaceholder: true)
  }

  func getSnapshot(in context: Context, completion: @escaping (SteadyEntry) -> Void) {
    let now = Date()
    let snapshot = WidgetSnapshot.load()?.resolved(for: now) ?? .placeholder
    completion(SteadyEntry(date: now, snapshot: snapshot, isPlaceholder: WidgetSnapshot.load() == nil))
  }

  func getTimeline(in context: Context, completion: @escaping (Timeline<SteadyEntry>) -> Void) {
    let now = Date()
    let stored = WidgetSnapshot.load()
    let current = SteadyEntry(date: now, snapshot: stored?.resolved(for: now) ?? .placeholder, isPlaceholder: stored == nil)
    // A second entry at midnight rolls the widget to a fresh day even if the app isn't opened.
    let midnight = Calendar.current.startOfDay(for: now.addingTimeInterval(86_400))
    var entries = [current]
    if let stored {
      entries.append(SteadyEntry(date: midnight, snapshot: stored.resolved(for: midnight), isPlaceholder: false))
    }
    completion(Timeline(entries: entries, policy: .after(midnight.addingTimeInterval(60))))
  }
}

// MARK: - Pieces

struct Ring: View {
  let progress: Double
  var lineWidth: CGFloat = 10

  var body: some View {
    ZStack {
      Circle().stroke(track, lineWidth: lineWidth)
      Circle()
        .trim(from: 0, to: progress)
        .stroke(accent, style: StrokeStyle(lineWidth: lineWidth, lineCap: .round))
        .rotationEffect(.degrees(-90))
    }
  }
}

struct StatusLine: View {
  let snapshot: WidgetSnapshot

  var body: some View {
    if snapshot.reached {
      Label("Goal reached", systemImage: "checkmark")
        .font(.caption.weight(.semibold))
        .foregroundStyle(accentText)
    } else {
      Text("\(snapshot.toGoal)g to goal")
        .font(.caption.weight(.semibold))
        .foregroundStyle(.secondary)
    }
  }
}

struct ActionButton: View {
  let title: String
  let systemImage: String
  let path: String

  var body: some View {
    Link(destination: link(path)) {
      HStack(spacing: 6) {
        Image(systemName: systemImage).font(.caption.weight(.semibold))
        Text(title).font(.caption.weight(.semibold)).lineLimit(1)
      }
      .foregroundStyle(accentText)
      .frame(maxWidth: .infinity, minHeight: 34)
      .background(RoundedRectangle(cornerRadius: 10).fill(track))
    }
  }
}

struct RingSummary: View {
  let snapshot: WidgetSnapshot
  var size: CGFloat = 92

  var body: some View {
    ZStack {
      Ring(progress: snapshot.progress, lineWidth: size * 0.11)
      VStack(spacing: 0) {
        Text("\(snapshot.total)g").font(.system(size: size * 0.26, weight: .bold, design: .rounded))
        Text("protein").font(.system(size: size * 0.11)).foregroundStyle(.secondary)
      }
    }
    .frame(width: size, height: size)
    .accessibilityElement(children: .ignore)
    .accessibilityLabel(snapshot.reached
      ? "\(snapshot.total) grams today. Goal reached."
      : "\(snapshot.total) grams today. \(snapshot.toGoal) grams to goal.")
  }
}

struct WeekBars: View {
  let snapshot: WidgetSnapshot

  var body: some View {
    let top = max(Double(snapshot.goalMax), Double(snapshot.week.map(\.total).max() ?? 0)) * 1.1
    HStack(alignment: .bottom, spacing: 8) {
      ForEach(Array(snapshot.week.enumerated()), id: \.offset) { _, day in
        VStack(spacing: 4) {
          if day.reached {
            Image(systemName: "checkmark").font(.system(size: 8, weight: .bold)).foregroundStyle(accentText)
          }
          RoundedRectangle(cornerRadius: 4)
            .fill(day.reached ? accent : (day.total > 0 ? neutralBar : track))
            .frame(height: max(4, CGFloat(Double(day.total) / max(top, 1)) * 70))
        }
        .frame(maxWidth: .infinity)
      }
    }
    .frame(height: 86, alignment: .bottom)
  }
}

// MARK: - Families

struct SteadyWidgetView: View {
  @Environment(\.widgetFamily) private var family
  let entry: SteadyEntry

  var body: some View {
    let s = entry.snapshot
    switch family {
    case .accessoryCircular:
      Gauge(value: s.progress) {
        Text("g")
      } currentValueLabel: {
        Text("\(s.total)")
      }
      .gaugeStyle(.accessoryCircularCapacity)
      .widgetURL(link("today"))
    case .accessoryRectangular:
      VStack(alignment: .leading, spacing: 2) {
        Text(s.reached ? "\(s.total)g · Goal reached ✓" : "\(s.total)g · \(s.toGoal)g to goal")
          .font(.headline)
          .widgetAccentable()
        Gauge(value: s.progress) { EmptyView() }
          .gaugeStyle(.accessoryLinearCapacity)
        Text("Goal \(s.goalMin)–\(s.goalMax)g").font(.caption2).foregroundStyle(.secondary)
      }
      .widgetURL(link("today"))
    case .accessoryInline:
      Text(s.reached ? "\(s.total)g protein · goal reached" : "\(s.total)g protein · \(s.toGoal)g to go")
        .widgetURL(link("today"))
    case .systemMedium:
      HStack(spacing: 16) {
        VStack(spacing: 8) {
          RingSummary(snapshot: s, size: 96)
          StatusLine(snapshot: s)
        }
        VStack(spacing: 8) {
          ActionButton(title: "Quick add", systemImage: "bolt.fill", path: "log/quick-add")
          ActionButton(title: "AI photo", systemImage: "camera.fill", path: "log/photo")
          ActionButton(title: "Set total", systemImage: "sum", path: "log/set-total")
        }
      }
      .widgetURL(link("today"))
    case .systemLarge:
      VStack(alignment: .leading, spacing: 14) {
        HStack(spacing: 16) {
          RingSummary(snapshot: s, size: 110)
          VStack(alignment: .leading, spacing: 4) {
            Text("Today").font(.headline)
            StatusLine(snapshot: s)
            Text("Goal \(s.goalMin)–\(s.goalMax)g").font(.caption).foregroundStyle(.secondary)
          }
          Spacer(minLength: 0)
        }
        WeekBars(snapshot: s)
        Grid(horizontalSpacing: 8, verticalSpacing: 8) {
          GridRow {
            ActionButton(title: "Quick add", systemImage: "bolt.fill", path: "log/quick-add")
            ActionButton(title: "AI photo", systemImage: "camera.fill", path: "log/photo")
          }
          GridRow {
            ActionButton(title: "Search", systemImage: "magnifyingglass", path: "log/search")
            ActionButton(title: "Set total", systemImage: "sum", path: "log/set-total")
          }
        }
      }
      .widgetURL(link("today"))
    default:
      VStack(spacing: 8) {
        RingSummary(snapshot: s, size: 92)
        StatusLine(snapshot: s)
      }
      .widgetURL(link("log/quick-add"))
    }
  }
}

struct SteadyWidget: Widget {
  let kind = "SteadyWidget"

  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: SteadyProvider()) { entry in
      SteadyWidgetView(entry: entry)
        .containerBackground(for: .widget) { Color(.systemBackground) }
        .redacted(reason: entry.isPlaceholder ? .placeholder : [])
    }
    .configurationDisplayName("Protein today")
    .description("See how much protein you’ve had and log in one tap.")
    .supportedFamilies([
      .accessoryCircular, .accessoryRectangular, .accessoryInline,
      .systemSmall, .systemMedium, .systemLarge,
    ])
  }
}

@main
struct SteadyWidgetBundle: WidgetBundle {
  var body: some Widget {
    SteadyWidget()
  }
}
