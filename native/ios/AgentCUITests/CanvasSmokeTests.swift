import XCTest

final class CanvasSmokeTests: XCTestCase {
    @MainActor
    func testCreateBoardAndReopenWithSource() {
        continueAfterFailure = false
        let app = XCUIApplication()
        app.launch()
        let web = app.webViews.firstMatch
        let title = "Studio Smoke \(UUID().uuidString.prefix(6))"
        let projectName = web.textFields["Project name"]
        XCTAssertTrue(projectName.waitForExistence(timeout: 20))
        projectName.tap()
        projectName.typeText(title + "\n")

        let sourceName = web.textFields["Source name"]
        XCTAssertTrue(sourceName.waitForExistence(timeout: 20), "Create project should open the canvas")
        sourceName.tap()
        sourceName.typeText("Editorial reference")
        let sourceURL = web.textFields["Source URL"]
        sourceURL.tap()
        sourceURL.typeText("https://example.com/reference\n")

        let nodeMap = web.descendants(matching: .any)["Node map"].firstMatch
        XCTAssertTrue(nodeMap.waitForExistence(timeout: 10))
        nodeMap.tap()
        let showSources = web.buttons["Show Sources"]
        if showSources.exists { showSources.tap() }
        let source = web.links["Open Editorial reference"]
        XCTAssertTrue(source.waitForExistence(timeout: 10), "The newly pinned source should be visible")
        XCTAssertTrue(web.staticTexts["Saved on this browser"].waitForExistence(timeout: 10))

        app.terminate()
        app.launch()
        let openProject = web.buttons["Open \(title)"]
        XCTAssertTrue(openProject.waitForExistence(timeout: 15), "The project should survive app relaunch")
        openProject.tap()
        if showSources.waitForExistence(timeout: 2) { showSources.tap() }
        XCTAssertTrue(source.waitForExistence(timeout: 15), "The source should survive app relaunch")
    }
}
