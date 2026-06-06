# Topology Patterns — Visual Reference

## Contents

- Hub-and-Spoke (Coordinator Pattern)
- Pipeline (Sequential Chain)
- Map-Reduce (Fan-Out / Fan-In)
- Hierarchical (Two-Level Coordination)
- Peer Mesh (Decentralized)
- Comparison Table

Common agent topologies with trade-offs. Pick the simplest topology that handles your workflow. You can always add complexity later; removing it is much harder.

## Hub-and-Spoke (Coordinator Pattern)

```
                 ┌──────────────┐
                 │  Coordinator  │
                 └──────┬───────┘
            ┌───────────┼───────────┐
            ▼           ▼           ▼
      ┌──────────┐ ┌──────────┐ ┌──────────┐
      │ Research │ │  Code    │ │  Review  │
      │ Agent    │ │  Agent   │ │  Agent   │
      └──────────┘ └──────────┘ └──────────┘
```

The coordinator delegates tasks to specialists and collects results. Specialists never talk to each other directly — all communication goes through the coordinator.

**When to use:** Most multi-agent systems should start here. Works well when the coordinator can understand enough to route effectively and when specialists produce independent outputs.

**Watch out for:** Coordinator context bloat. As the number of specialists grows, the coordinator must understand more and its prompts get larger. If you pass 5-6 specialists, consider hierarchical.

## Pipeline (Sequential Chain)

```
  ┌──────────┐     ┌──────────┐     ┌──────────┐
  │ Ingestion│────▶│ Analysis │────▶│ Synthesis│
  │ Agent    │     │ Agent    │     │ Agent    │
  └──────────┘     └──────────┘     └──────────┘
```

Each agent processes the output of the previous agent. Work flows in one direction. No branching, no feedback loops.

**When to use:** ETL-style workflows, document processing pipelines, or any task with clear sequential stages where each stage's output is the next stage's input.

**Watch out for:** Context degradation at each hop. Use structured handoff objects between stages. Keep the pipeline to 3 stages max — beyond that, context loss compounds severely.

## Map-Reduce (Fan-Out / Fan-In)

```
                 ┌──────────────┐
                 │  Coordinator  │
                 └──────┬───────┘
            ┌───────────┼───────────┐
            ▼           ▼           ▼
      ┌──────────┐ ┌──────────┐ ┌──────────┐
      │ Worker A │ │ Worker B │ │ Worker C │
      └─────┬────┘ └─────┬────┘ └─────┬────┘
            └─────────────┼─────────────┘
                          ▼
                 ┌──────────────┐
                 │  Aggregator   │
                 └──────────────┘
```

The coordinator splits work into independent chunks and fans out to parallel workers. An aggregator (often the coordinator itself) collects and combines results.

**When to use:** When work is naturally parallelizable — analyzing multiple files, researching multiple topics, reviewing multiple sections. Each worker handles one chunk independently.

**Watch out for:** The aggregation step is harder than it looks. Combining partial results requires judgment, not just concatenation. Budget tokens for aggregation — it often costs as much as a single worker.

## Hierarchical (Two-Level Coordination)

```
                    ┌───────────────┐
                    │ Top Coordinator│
                    └───────┬───────┘
               ┌────────────┼────────────┐
               ▼            ▼            ▼
        ┌────────────┐ ┌──────────┐ ┌────────────┐
        │ Frontend   │ │ Backend  │ │   QA       │
        │ Lead       │ │ Lead     │ │   Lead     │
        └─────┬──────┘ └────┬─────┘ └─────┬──────┘
          ┌───┼───┐     ┌───┼───┐     ┌───┼───┐
          ▼   ▼   ▼     ▼   ▼   ▼     ▼   ▼   ▼
         CSS  JS  A11y  API  DB  Auth  Unit Int  E2E
```

A top-level coordinator delegates to sub-coordinators, each of which manages its own specialists. Two levels of delegation.

**When to use:** Large systems where a single coordinator cannot understand all specialist domains. Each sub-coordinator is an expert in its domain and knows how to route within it.

**Watch out for:** Two hops of delegation means two hops of context loss. The top coordinator's instructions to a sub-coordinator must be precise enough that the sub-coordinator makes the right routing decisions. This topology is expensive — use it only when a flat hub-and-spoke genuinely cannot handle the complexity.

## Peer Mesh (Decentralized)

```
      ┌──────────┐◄────────►┌──────────┐
      │ Agent A  │          │ Agent B  │
      └─────┬────┘          └────┬─────┘
            │    ◄──────────►    │
            │   ┌──────────┐     │
            └──►│ Agent C  │◄────┘
                └──────────┘
```

Every agent can communicate directly with every other agent. No coordinator. Agents negotiate, request help, and share results peer-to-peer.

**When to use:** Almost never for LLM-based agents. This topology is common in traditional distributed systems but creates severe problems with LLM agents: unbounded token spend from cross-talk, no single point of observability, and emergent behavior that is nearly impossible to debug.

**Watch out for:** Everything. If you think you need a peer mesh, you probably need a hub-and-spoke with better routing logic. The only legitimate use case is when agents are truly autonomous entities with their own goals (multi-player simulations, adversarial setups).

## Comparison Table

| Topology       | Best For                            | Coordination Cost | Debuggability | Resilience |
|----------------|-------------------------------------|-------------------|---------------|------------|
| Hub-and-Spoke  | Most workflows, clear routing       | Low-Medium        | High          | Low        |
| Pipeline       | Sequential processing stages        | Low               | High          | Low        |
| Map-Reduce     | Parallelizable independent work     | Medium            | Medium        | Medium     |
| Hierarchical   | Large systems, domain-specific routing | High           | Medium        | Medium     |
| Peer Mesh      | Avoid for LLM agents               | Very High         | Very Low      | High       |

**Reading the table:**
- **Coordination Cost**: token and latency overhead from the topology itself (not the work)
- **Debuggability**: how easy it is to trace a request through the system and understand what happened
- **Resilience**: how well the system handles a single agent failing

The default recommendation is hub-and-spoke. Graduate to map-reduce when you have parallelizable work. Graduate to hierarchical only when you have proven that a flat coordinator cannot handle the routing complexity. Avoid peer mesh for LLM agents.
