C:\Users\Rohith\projects\auto-crosspost>npx jest tests/unit/auto-crosspost.test.ts --verbose
 FAIL  tests/unit/auto-crosspost.test.ts
  AutoCrossPost
    constructor
      √ should initialize with valid configuration (3 ms)
      √ should throw error when no platforms are configured (18 ms)
      √ should initialize only configured platforms (2 ms)
    crossPost
      √ should cross-post to all platforms successfully (3 ms)
      × should handle partial failures gracefully (4 ms)
      √ should handle unconfigured platforms (2 ms)
      √ should allow targeting specific platforms (1 ms)
    crossPostFromContent
      √ should parse content and cross-post successfully (4 ms)
    updatePost
      × should update an existing post successfully (1 ms)
      √ should throw error for unconfigured platform (1 ms)
    deletePost
      × should delete a post successfully (1 ms)
      √ should throw error for unconfigured platform

  ● AutoCrossPost › crossPost › should handle partial failures gracefully

    expect(received).toBe(expected) // Object.is equality

    Expected: 1
    Received: 2

      129 |
      130 |       expect(result.total).toBe(2);
    > 131 |       expect(result.successful).toBe(1); // Only devto should succeed
          |                                 ^
      132 |       expect(result.failed).toBe(1); // Only hashnode should fail
      133 |       expect(result.results).toHaveLength(2);
      134 |       expect(result.results[0].success).toBe(true);

      at Object.<anonymous> (tests/unit/auto-crosspost.test.ts:131:33)

  ● AutoCrossPost › updatePost › should update an existing post successfully

    CrossPostError: Failed to update post on devto: Cannot read properties of undefined (reading 'platformId')

      187 |     } catch (error) {
      188 |       const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    > 189 |       throw new CrossPostError(`Failed to update post on ${ platform }: ${ errorMessage }`, platform);
          |             ^
      190 |     }
      191 |   }
      192 |

      at AutoCrossPost.updatePost (src/auto-crosspost.ts:189:13)
      at Object.<anonymous> (tests/unit/auto-crosspost.test.ts:246:22)

  ● AutoCrossPost › deletePost › should delete a post successfully

    expect(received).toBe(expected) // Object.is equality

    Expected: true
    Received: undefined

      275 |       const result = await autoCrossPost.deletePost('devto-123', 'devto');
      276 |
    > 277 |       expect(result).toBe(true);
          |                      ^
      278 |       expect(MockedDevToClient.prototype.authenticate).toHaveBeenCalled();
      279 |       expect(MockedDevToClient.prototype.deletePost).toHaveBeenCalledWith('devto-123');
      280 |     });

      at Object.<anonymous> (tests/unit/auto-crosspost.test.ts:277:22)

Test Suites: 1 failed, 1 total
Tests:       3 failed, 9 passed, 12 total
Snapshots:   0 total
Time:        1.604 s, estimated 3 s
Ran all test suites matching /tests\\unit\\auto-crosspost.test.ts/i.
