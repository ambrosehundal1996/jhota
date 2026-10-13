#!/usr/bin/env ruby
# Idempotently configures Steady.xcodeproj: bundle ids, iOS 17, entitlements, the
# SharedWidgetStore native module, and the SteadyWidget WidgetKit extension.
# Usage: ruby ios/scripts/configure_xcode.rb   (then `pod install`)

require 'xcodeproj'

IOS_DIR = File.expand_path('..', __dir__)
PROJECT_PATH = File.join(IOS_DIR, 'Steady.xcodeproj')
APP_BUNDLE_ID = ENV.fetch('STEADY_BUNDLE_ID', 'app.steady.ios')
WIDGET_BUNDLE_ID = "#{APP_BUNDLE_ID}.widget"
DEPLOYMENT_TARGET = '17.0'
DEVELOPMENT_TEAM = ENV['STEADY_TEAM_ID']

project = Xcodeproj::Project.open(PROJECT_PATH)
app = project.targets.find { |t| t.name == 'Steady' } or abort('Steady target not found')

project.build_configurations.each do |config|
  config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = DEPLOYMENT_TARGET
end

# The RN template's "Steady" group has no folder path; its files carry "Steady/..." paths.
def ensure_file(group, name, prefix = nil)
  path = prefix ? "#{prefix}/#{name}" : name
  stale = group.files.select { |f| f.display_name == name && f.path != path }
  stale.each do |ref|
    ref.build_files.each { |bf| bf.remove_from_project }
    ref.remove_from_project
  end
  group.files.find { |f| f.path == path } || group.new_reference(path).tap { |ref| ref.name = name if prefix }
end

# --- App target -------------------------------------------------------------
app_group = project.main_group.find_subpath('Steady', false) or abort('Steady group not found')
app_prefix = app_group.path.nil? ? 'Steady' : nil
%w[SharedWidgetStore.swift SharedWidgetStore.m].each do |name|
  ref = ensure_file(app_group, name, app_prefix)
  app.source_build_phase.add_file_reference(ref, true)
end
ensure_file(app_group, 'Steady.entitlements', app_prefix)
ensure_file(app_group, 'Steady-Bridging-Header.h', app_prefix)

app.build_configurations.each do |config|
  s = config.build_settings
  s['PRODUCT_BUNDLE_IDENTIFIER'] = APP_BUNDLE_ID
  s['IPHONEOS_DEPLOYMENT_TARGET'] = DEPLOYMENT_TARGET
  s['CODE_SIGN_ENTITLEMENTS'] = 'Steady/Steady.entitlements'
  s['SWIFT_OBJC_BRIDGING_HEADER'] = 'Steady/Steady-Bridging-Header.h'
  s['TARGETED_DEVICE_FAMILY'] = '1'
  s['DEVELOPMENT_TEAM'] = DEVELOPMENT_TEAM if DEVELOPMENT_TEAM
end

# --- Widget extension -------------------------------------------------------
widget = project.targets.find { |t| t.name == 'SteadyWidget' }
unless widget
  widget = project.new_target(:app_extension, 'SteadyWidget', :ios, DEPLOYMENT_TARGET, nil, :swift)
end

widget_group = project.main_group.find_subpath('SteadyWidget', false) ||
               project.main_group.new_group('SteadyWidget', 'SteadyWidget')
%w[SteadyWidget.swift WidgetSnapshot.swift].each do |name|
  ref = ensure_file(widget_group, name)
  widget.source_build_phase.add_file_reference(ref, true)
end
ensure_file(widget_group, 'Info.plist')
ensure_file(widget_group, 'SteadyWidget.entitlements')

%w[WidgetKit SwiftUI].each do |framework|
  next if widget.frameworks_build_phase.files_references.any? { |f| f.path&.end_with?("#{framework}.framework") }
  widget.add_system_framework(framework)
end

widget.build_configurations.each do |config|
  s = config.build_settings
  s['PRODUCT_NAME'] = '$(TARGET_NAME)'
  s['PRODUCT_BUNDLE_IDENTIFIER'] = WIDGET_BUNDLE_ID
  s['INFOPLIST_FILE'] = 'SteadyWidget/Info.plist'
  s['CODE_SIGN_ENTITLEMENTS'] = 'SteadyWidget/SteadyWidget.entitlements'
  s['IPHONEOS_DEPLOYMENT_TARGET'] = DEPLOYMENT_TARGET
  s['SWIFT_VERSION'] = '5.0'
  s['TARGETED_DEVICE_FAMILY'] = '1'
  s['SKIP_INSTALL'] = 'YES'
  s['GENERATE_INFOPLIST_FILE'] = 'NO'
  s['MARKETING_VERSION'] = '$(MARKETING_VERSION)'
  s['CURRENT_PROJECT_VERSION'] = '1'
  s['LD_RUNPATH_SEARCH_PATHS'] = ['$(inherited)', '@executable_path/Frameworks', '@executable_path/../../Frameworks']
  s['APPLICATION_EXTENSION_API_ONLY'] = 'YES'
  s['DEVELOPMENT_TEAM'] = DEVELOPMENT_TEAM if DEVELOPMENT_TEAM
end

app.add_dependency(widget) unless app.dependencies.any? { |d| d.target == widget }

embed = app.copy_files_build_phases.find { |p| p.name == 'Embed Foundation Extensions' }
unless embed
  embed = app.new_copy_files_build_phase('Embed Foundation Extensions')
  embed.dst_subfolder_spec = '13' # PlugIns
end
unless embed.files_references.include?(widget.product_reference)
  build_file = embed.add_file_reference(widget.product_reference, true)
  build_file.settings = { 'ATTRIBUTES' => ['RemoveHeadersOnCopy'] }
end

project.save
puts "Configured #{PROJECT_PATH}: #{APP_BUNDLE_ID} + #{WIDGET_BUNDLE_ID} (iOS #{DEPLOYMENT_TARGET})"
