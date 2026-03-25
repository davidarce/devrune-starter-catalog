---
name: java-unit-tests
scope: testing
applies-to:
  - unit-test-adviser
description: "Java Unit Test Standards"
paths:
  - "**/*Test.java"
  - "**/*Tests.java"
---

# Java Unit Test Standards

```xml
<strategy>
  <objective>
    Create unit tests for the selected code (module, package or class).
  </objective>
  <steps>
    <step>
      1. ⛔ Before starting, ensure the project can be built with Maven without errors and all generated code is up to date. To do this, use the command "Build the Project with Maven excluding tests".
    </step>
    <step>
      2. 📄 Review the code structure of the selected code to be tested and the rules defined in this document and make an implementation proposal.
    </step>
    <step>
      3. ⏳ Wait for confirmation of the implementation proposal before generating the unit tests.
    </step>
    <step>
      4. ✅ Once confirmed, generate the unit tests following all the rules defined in this document.
    </step>
    <step>
      5. 🔍 After generating the unit tests, ensure they are compliant with the project's code format. Use the command "Format the Code with Spotless".
    </step>
    <step>
      6. 🧪 Execute all the generated unit tests to ensure they pass successfully. If the IDE has built-in support for running tests with coverage, use it. Otherwise, use the command "Run the Unit Tests with Maven".
    </step>
    <step>
      7. ✅ Ensure that all the generated unit tests pass successfully.
    </step>
    <step>
      8. 📊 Execute mutation tests on all the generated unit tests to ensure the quality and effectiveness of the generated unit tests. If the IDE has built-in support for running mutation tests, use it. Otherwise, use the command "Run the Mutation Tests with Maven".
    </step>
    <step>
      9. 📈 Finally, analyze the results of the mutation tests and make any necessary adjustments to the unit tests to improve their quality and effectiveness.
       💻 Summary is provided in the console output.
       📄 Detailed report is generated in the <module-name>/target/pitest-report directory.
    </step>
    <step>
      10. 🎉 Once all the above steps are completed successfully, review if all the tests follow all the rules, and provide a list of non-compliant tests, if any.
    </step>
  </steps>
  <execution>
    ⚠️ After code changes and before running tests or mutation tests, ensure the format is correct using the formatting command.
    ⚠️ Ensure that each command completes before moving on to the next step.
    ⚠️ Review the output of each command for any errors or issues.
  </execution>
  <commands>
    <instructions>
      📝 Replace `{module-name}` with the name of the module containing the code to be tested.
      📝 Replace `{package_name}` with the package name of the code to be tested (e.g., `com.example.myapp.users.apirest.controller`).
      📝 Replace `{package_path}` with the package path of the code to be tested (e.g., `com/example/myapp/users/apirest/controller`).
    </instructions>
    <command>
      <name>Build the Project with Maven excluding tests</name>
      <value>mvn clean install -DskipTests -DskipITs -Dskip.integration.tests=true -DskipUTs -Dskip.unit.tests=true -Dmaven.build.cache.enabled=false</value>
    </command>
    <command>
      <name>Format the Code with Spotless</name>
      <value>mvn spotless:apply -pl {module-name}</value>
    </command>
    <command>
      <name>Run the Unit Tests with Maven</name>
      <value>mvn verify -pl {module-name} -Dmaven.build.cache.enabled=false -Dsurefire.includes={package_path}/*Test.java</value>
    </command>
    <command>
      <name>Run Mutation Tests with Maven (Single Module)</name>
      <value>mvn test-compile pitest:mutationCoverage -pl {module-name} -DtargetClasses={package_name}.* -DtargetTests={package_name}.*Test</value>
    </command>
    <command>
      <name>Run Mutation Tests with Maven (Multi-Module)</name>
      <value>mvn test-compile pitest:mutationCoverage pitest:report-aggregate-module -pl {module-name} -DtargetClasses={package_name}.* -DtargetTests={package_name}.*Test</value>
    </command>
    <command>
      <name>View Mutation Testing Results</name>
      <value>w3m -dump {module-name}/target/pit-reports/index.html | sed -n '5,7p'</value>
    </command>
  </commands>
  <reporting>
    <terminal>
      <description>
        Summary of unit test execution with coverage and mutation tests is provided in the console output.
      </description>
      <output>
        ================================================================================
        - Statistics
        ================================================================================
        >> Line Coverage (for mutated classes only): 350/358 (98%)
        >> 32 tests examined
        >> Generated 139 mutations Killed 136 (98%)
        >> Mutations with no coverage 1. Test strength 99%
        >> Ran 214 tests (1.54 tests per mutation)
      </output>
    </terminal>
    <html>
      <description>
        Detailed report of unit test execution with coverage and mutation tests is generated in the {module-name}/target/pitest-report directory.
      </description>
      <output>
        Number of Classes Line Coverage Mutation Coverage Test Strength
        2                 100%          100%              100%
                          34/34         13/13             13/13
      </output>
    </html>
  </reporting>
</strategy>
```

## **Test Structure and Organization**

### **Directory Structure**

```xml
<rule category="structure" scope="directory">
  <instruction>Tests must be properly named and located</instruction>
  <do>
    ✅ Tests MUST be located in the same package as the class under test in the `src/test/java` directory
    ✅ Test class name MUST be the same as the class under test with the suffix `Test` appended
  </do>
  <dont>
    ❌ DO NOT place tests in different packages or use different naming conventions
  </dont>
  <example>
    🔔 For a class `src/main/java/com/example/myapp/users/apirest/controller/UserController.java`, the test class should be `src/test/java/com/example/myapp/users/apirest/controller/UserControllerTest.java`
  </example>
</rule>
```

### **Test Class Structure**

```xml
<rule category="structure" type="class">
  <instruction>Test classes must follow a consistent structure</instruction>
  <do>
    ✅ Order elements as follows: tested object, mocks (mock, spy, captors), before methods, after methods, tests, private methods
    ✅ Use `@ExtendWith(MockitoExtension.class)` for Mockito integration
    ✅ Organize tests by method using `@Nested` classes for better readability.
    ✅ For the Nested class name use the method name as the nested class name with first letter capitalized, e.g., `class Method { ... }`.
    ✅ For the Nested class related to the constructor tests, use `class Constructor { ... }`
    ✅ If there is a naming conflict with the nested class name and a business class, the business class should be fully qualified in the test class.
  </do>
  <dont>
    ❌ DO NOT append "Tests" or "Test" suffix to the nested class names.
    ❌ DO NOT mix the order of class elements
    ❌ DO NOT use `@SpringBootTest`, `@SpringJUnitConfig` or other heavy frameworks for unit tests
  </dont>
  <example>
    🔔
    @ExtendWith(MockitoExtension.class)
    class UserControllerTest {

      private UserController controller;

      @Mock
      private CommandBus commandBus;

      @Captor
      private ArgumentCaptor<CreateUserCommand> createCommand;

      @Mock
      private QueryBus queryBus;

      @Captor
      private ArgumentCaptor<FindUsersQuery> findQuery;

      @BeforeEach
      void beforeEach() {
        controller = new UserController(commandBus, queryBus);
      }

      @Nested
      class CreateUser {
        // test methods
      }

      @Nested
      class FindUsers {
        // test methods
      }

      // other nested test classes and test methods
   }
  </example>
</rule>
```

## **Test Naming Conventions**

### **Method Naming**

```xml
<rule category="naming" type="method" pattern="when_expect">
  <instruction>Test methods must follow descriptive naming conventions</instruction>
  <do>
    ✅ Use descriptive names following the `when_{ACTION}_expect_{RESULT}` pattern
    ✅ Use snake case style for method names
    ✅ Be consistent with the chosen pattern across the entire project
  </do>
  <dont>
    ❌ DO NOT include the word "test" in method names when using descriptive patterns
    ❌ DO NOT use @DisplayName, used descriptive method names instead
    ❌ DO NOT include the method being tested in the test method name when using nested classes
  </dont>
  <example>
    🔔 when_user_present_expect_user_found
    🔔 when_user_not_present_expect_exception
  </example>
  <counterexample>
    🔕 test1, test2
    🔕 test_methodName_1, test_methodName_2
    🔕 whenUserPresent_expectUserFound
    🔕 test_find_user_when_user_present_expect_user_found
  </counterexample>
</rule>
```

## **Test Method Structure**

### **AAA 3A Pattern (Arrange, Act, Assert)**

```xml
<rule category="structure" type="method" pattern="3A">
  <instruction>Test methods must follow the 3A pattern</instruction>
  <do>
    ✅ Structure ALL test methods using the 3A pattern
    ✅ **Arrange**: Set up the data and mocks needed for the test.
      ☑️ This section includes creating test data and stubbing mock behaviors.
      ☑️ This section can be multiple lines long.
      ☑️ This section can be non-existent if no setup is needed.
    ✅ **Act**: Call the actual function being tested
      ☑️ This section typically contains a single line that invokes the method under test.
    ✅ **Assert**: Check that expected values match actual values
      ☑️ This section includes assertions and mock verifications.
      ☑️ This section can be multiple lines long.
      ☑️ This section can not be non-existent; at least one assertion or verification is required.
    ✅ Each section must be clearly separated by a single empty line
    ✅ Each section should contain all relevant code without empty lines within the section
  </do>
  <dont>
    ❌ DO NOT leave empty lines within each section
  </dont>
  <example>
    🔔
    @Test
    void when_users_present_expect_ok() {
      // Given
      final User user1 = UserMother.aValidUser();
      final User user2 = UserMother.otherValidUser();
      given(queryBus.ask(any())).WillReturn(List.of(user1, user2));

      // When
      final var response = controller.findUsers();

      //Then
      assertThat(response).isNotNull();
      assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
      // ... other assertions / mock verifications ...
    }
  </example>
  <counterexample>
    🔕
    @Test
    void when_users_present_expect_ok() {
      final User user1 = UserMother.aValidUser();
      final User user2 = UserMother.otherValidUser();
      when(queryBus.ask(any())).thenReturn(List.of(user1, user2));

      final var response = controller.findUsers();

      assertThat(response).isNotNull();
      assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
      // ... other assertions / mock verifications ...
    }
  </counterexample>
</rule>
```

## **Test Assertions**

### **AssertJ Usage**

```xml
<rule category="assertions" type="method" pattern="assertj">
  <instruction>Use AssertJ for assertions in test methods</instruction>
  <do>
    ✅ Use AssertJ as the primary assertion library for its fluent API and descriptive failure messages
    ✅ Chain assertions when possible: `assertThat(...).isNotNull().hasSize(...)`
    ✅ AssertJ assertions should be simplified to the corresponding dedicated assertion
    ✅ Use `ThrowingCallable result = () -> { ... };` combined with
`assertThatThrownBy(result).isInstanceOf(XXXX.class).hasMessageContaining("...");` for exception testing
  </do>
  <dont>
    ❌ DO NOT use JUnit assertions when AssertJ provides better alternatives
    ❌ DO NOT use try-catch blocks for exception testing
  </dont>
  <example>
    🔔 assertThat(products).isNotNull().hasSize(1)
    🔔 assertThat(result).isZero();
    🔔 assertThat(list).isEmpty();
    🔔 ThrowingCallable result = () -> controller.getUserByName(username);
        assertThatThrownBy(result).isInstanceOf(UserNotFound.class).hasMessageContaining("User not found");
  </example>
  <counterexample>
    🔕 assertEquals(1, products.size());
    🔕 assertThat(result).isEqualTo(0);
    🔕 assertThat(list).hasSize(0)
    🔕 assertThatThrownBy(() -> controller.getUserByName(username)).isInstanceOf(NoSuchElementException.class);
  </counterexample>
```

## **Parameterized Tests**

### **Parameterized Tests Usage**

```xml
<rule category="structure" type="method" pattern="parameterized">
  <instruction>Use Parameterized Tests for multiple input scenarios</instruction>
  <do>
    ✅ Similar tests should be grouped in a single Parameterized test
    ✅ Use `@ParameterizedTest` for tests that need to run with multiple input values
    ✅ Use appropriate source annotations like `@ValueSource`, `@CsvSource`, or `@MethodSource` to provide test data
    ✅ Use descriptive parameter names for better test output
  </do>
  <dont>
    ❌ DO NOT create separate test methods for each input scenario when parameterized tests can be used
    ❌ DO NOT create multiple identical test methods when parameterization is possible
  </dont>
  <example>
    🔔
    @ParameterizedTest
    @ValueSource(strings = {"", " ", "invalid"})
    void when_invalid_email_expect_exception(String email) {
      Throwable thrown = catchThrowable(() -> Email.of(email));

      assertThat(thrown).isInstanceOf(IllegalArgumentException.class);
    }
  </example>
  <counterexample>
    🔕
    @Test
    void when_empty_email_expect_exception() {
      Throwable thrown = catchThrowable(() -> Email.of(""));

      assertThat(thrown).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void when_blank_email_expect_exception() {
      Throwable thrown = catchThrowable(() -> Email.of(" "));

      assertThat(thrown).isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void when_invalid_email_expect_exception() {
      Throwable thrown = catchThrowable(() -> Email.of("invalid"));

      assertThat(thrown).isInstanceOf(IllegalArgumentException.class);
    }
  </counterexample>
</rule>
```

## **Test Data Management**

### **Date and Time**

```xml
<rule category="data" type="method" pattern="date-time">
  <instruction>Manage date and time values in tests effectively</instruction>
  <do>
    ✅ Use fixed values for dates and times to ensure test repeatability
    ✅ Use `Clock.fixed()` for time-dependent logic testing
    ✅ Be mindful of time zones; use UTC when possible
  </do>
  <dont>
    ❌ DO NOT use `now()` values that can change between test runs
  </dont>
  <example>
    🔔 var instant = Instant.parse("2025-10-22T18:45:00Z");
    🔔 var instant = Clock.fixed(Instant.parse("2025-10-22T18:45:00Z"), ZoneId.of("Europe/London")).instant();
  </example>
  <counterexample>
    🔕 var instant = Instant.now();
  </counterexample>
</rule>
```

### **Test Data Creation**

```xml
<rule category="data" type="method" pattern="object-mother">
  <instruction>Use Object Mother pattern for test data creation</instruction>
  <do>
    ✅ Use Object Mother pattern for test data creation
    ✅ Create reusable test data mothers for common entities
    ✅ When test data is only relevant to a specific test method, consider creating it directly within that method
    ✅ When mothers are located in different modules, they must be shared using maven jar plugin with goal: `test-jar` and includes `**/*Mother.*` and `**/*Mother$*.*`
    ✅ When mothers are located in different modules, they must be included as dependencies with classifier `tests` and scope `test`
  </do>
  <dont>
    ❌ DO NOT duplicate test data creation across multiple tests
    ❌ DO NOT create mothers in a separate class when they are only used in a single test class
  </dont>
  <example>
    🔔 final User user = UserMother.aValidUser();
  </example>
  <counterexample>
    🔕 User user = new User("John", "Doe", "john.doe@example.com");
  </counterexample>
  <pom-settings>
    <build>
      <plugins>
        <plugin>
          <groupId>org.apache.maven.plugins</groupId>
          <artifactId>maven-jar-plugin</artifactId>
          <executions>
            <execution>
              <goals>
                <goal>test-jar</goal>
              </goals>
              <configuration>
                <includes>
                  <include>**/*Mother.*</include>
                  <include>**/*Mother$*.*</include>
                </includes>
              </configuration>
            </execution>
          </executions>
        </plugin>
      </plugins>
    </build>
    <dependencies>
      <dependency>
        <groupId>com.example.myapp</groupId>
        <artifactId>users-domain</artifactId>
        <classifier>tests</classifier>
        <scope>test</scope>
      </dependency>
    </dependencies>
  </pom-settings>
</rule>
```

## **Mocking and Verification**

### **Mock Definition**

```xml
<rule category="mocking" type="class">
  <instruction>Use Mockito for mocking and verification</instruction>
  <do>
    ✅ Use Mockito as the mocking framework
    ✅ Use `@Mock` annotation to mark parts of code to be mocked
    ✅ **Preferred**: Use `@InjectMocks` only when constructor injection is not available
    ✅ **Alternative**: Instantiate the class by constructor in `@BeforeEach` and pass mocks as parameters
  </do>
  <dont>
    ❌ DO NOT instantiate the class by constructor when injection is possible by using @InjectMocks
  </dont>
  <example>
    @ExtendWith(MockitoExtension.class)
    class UserServiceTest {

      @InjectMocks
      private UserService userService;

      @Mock
      private UserRepository userRepository;

      // nested test classes and test methods

    }
  </example>
  <counterexample>
    @ExtendWith(MockitoExtension.class)
    class UserServiceTest {

      private UserService userService;

      @Mock
      private UserRepository userRepository;

      @BeforeEach
      void setUp() {
        this.userService = new UserService(this.userRepository);
      }

      // nested test classes and test methods
    }
  </counterexample>
</rule>
```

### **Method Stubbing**

```xml
<rule category="mocking" type="method" pattern="stubbing">
  <instruction>Use Mockito for method stubbing</instruction>
  <do>
    ✅ Use `given().willReturn()` for standard stubbing
    ✅ Use `given().willThrow()` for exception scenarios
    ✅ Use `given().WillCallRealMethod()` sparingly for specific real method calls
  </do>
  <dont>
    ❌ DO NOT over-stub methods that aren't relevant to the test
  </dont>
  <example>
    🔔 given(userRepository.findById(userId)).willReturn(Optional.of(user));
    🔔 given(userRepository.save(user)).willThrow(new UserAlreadyExists());
  </example>
</rule>
```

### **Method Verification**

```xml
<rule category="mocking" type="method" pattern="verification">
  <instruction>Use Mockito for method verification</instruction>
  <do>
    ✅ Use `then()` to check method invocations
    ✅ Be explicit about expected call counts: `then(mock).should(times(1))`, `then(mock).shouldHaveNoInteractions()`
  </do>
  <dont>
    ❌ DO NOT verify interactions that aren't critical to the test
  </dont>
  <example>
    🔔 then(userRepository).should(times(1)).findById(userId);
    🔔 then(userRepository).should(never()).findById(userId);
  </example>
</rule>
```

### **Argument Capturing**

```xml
<rule category="mocking" type="method" pattern="argument-capturing">
  <instruction>Use ArgumentCaptor for capturing method arguments</instruction>
    <do>
      ✅ Use `@Captor ArgumentCaptor<Type>` for capturing method arguments common to multiple tests
      ✅ Use `ArgumentCaptor<Type> captor = ArgumentCaptor.forClass(Type.class)` for capturing method arguments specific to a single test
      ✅ Verify captured arguments with AssertJ assertions
    </do>
    <dont>
      ❌ DO NOT capture arguments unless verification is necessary
    </dont>
    <example>
      🔔 @Captor
         private ArgumentCaptor<User> userCaptor;
      🔔 then(userRepository).should(times(1)).save(userCaptor.capture());
         assertThat(userCaptor.getValue().getName()).isEqualTo("John Doe");
  </example>
</rule>
```

### **Spying**

```xml
<rule category="mocking" type="method" pattern="spying">
  <instruction>Use Mockito Spies to track interactions with real objects</instruction>
  <do>
    ✅ Use `@Spy` when you need to call real methods but still want to track interactions
    ✅ Prefer mocks over spies when full control is needed
  </do>
  <dont>
    ❌ DO NOT overuse spies; use mocks when possible
  </dont>
</rule>
```

### **Static Methods**

```xml
<rule category="mocking" type="method" pattern="static-mocking">
  <instruction>Use Mockito for static method mocking</instruction>
  <do>
    ✅ Use `mockStatic()` from Mockito for mocking static methods
    ✅ Limit the scope of static mocking to the test method using try-with-resources
    ✅ Keep static mocking scope as narrow as possible
  </do>
  <dont>
    ❌ DO NOT leave static mocks active beyond the test scope
  </dont>
  <example>
    🔔
    try (final MockedStatic<Type> mock = mockStatic(Type.class)) {
      mock.when(Type::staticMethod).thenReturn(...);
      // test logic here
   }
  </example>
</rule>
```

## **Code Formatting**

### **Code Formatting**

```xml
<rule category="formatting" type="class">
  <instruction>Code must follow consistent formatting conventions</instruction>
  <do>
    ✅ Code must follow the project's formatting conventions (e.g., Spotless + google-java-format)
    ✅ Use IDE formatting support for on-the-fly formatting (if available)
    ✅ Use `mvn spotless:apply` to format code before committing
  </do>
  <dont>
    ❌ DO NOT commit code that does not adhere to formatting rules
  </dont>
</rule>
```

## **Code Coverage and Quality**

### **Quality** (all tests must pass, ...)

```xml
<rule category="quality" type="tests">
  <instruction>Code must meet quality standards</instruction>
  <do>
    ✅ Ensure all tests pass successfully
    ✅ Ensure all code follows the code format conventions
    ✅ Ensure no SonarQube Issues are detected in the tests (if IDE supports SonarQube analysis)
  </do>
  <dont>
    ❌ DO NOT ignore failing tests
    ❌ DO NOT ignore code format violations
    ❌ DO NOT ignore SonarQube Issues in the tests
  </dont>
</rule>
```

### **Code Coverage**

```xml
<rule category="quality" type="coverage">
  <instruction>Code must meet coverage thresholds</instruction>
  <do>
    ✅ Ensure each test class covers at least 80% of the code it tests
    ✅ Ensure each test class covers at least 80% of the branches in the code it tests
    ✅ Ensure each test class achieves at least 80% mutation coverage in the code it tests
    ✅ Use JaCoCo for code coverage measurement
    ✅ Use PIT for mutation testing
  </do>
  <dont>
    ❌ DO NOT ignore line coverage below 80%
    ❌ DO NOT ignore branch coverage below 80%
    ❌ DO NOT ignore mutation coverage below 80%
  </dont>
</rule>
```
