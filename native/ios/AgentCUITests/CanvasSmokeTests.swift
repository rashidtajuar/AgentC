import XCTest

final class CanvasSmokeTests: XCTestCase {
    @MainActor
    func testCreateBoardAndReopenWithSource() {
        let app = XCUIApplication()
        app.launch()
        let web = app.webViews.firstMatch
        let title = "Studio Smoke \(UUID().uuidString.prefix(6))"
        let projectName = web.textFields["Project name"]
        XCTAssertTrue(projectName.waitForExistence(timeout: 20))
        projectName.tap()
        projectName.typeText(title)
        web.buttons["Create project"].tap()

        let sourceName = web.textFields["Source name"]
        XCTAssertTrue(sourceName.waitForExistence(timeout: 15))
        sourceName.tap()
        sourceName.typeText("Editorial reference")
        let sourceURL = web.textFields["Source URL"]
        sourceURL.tap()
        sourceURL.typeText("https://example.com/reference")
        web.buttons["Add source"].tap()
        XCTAssertTrue(web.staticTexts["Saved on this browser"].waitForExistence(timeout: 10))

        let nodeMap = web.descendants(matching: .any)["Node map"].firstMatch
        XCTAssertTrue(nodeMap.waitForExistence(timeout: 5))
        nodeMap.tap()
        web.buttons["Projects"].tap()
        let openProject = web.buttons["Open \(title)"]
        XCTAssertTrue(openProject.waitForExistence(timeout: 10))
        openProject.tap()
        let showSources = web.buttons["Show Sources"]
        if showSources.waitForExistence(timeout: 2) { showSources.tap() }
        XCTAssertTrue(web.links["Open Editorial reference"].waitForExistence(timeout: 15))
    }
}
