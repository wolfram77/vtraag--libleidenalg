#include <igraph/igraph.h>
#include <libleidenalg/GraphHelper.h>
#include <libleidenalg/Optimiser.h>
#include <libleidenalg/ModularityVertexPartition.h>
#include <libleidenalg/RBConfigurationVertexPartition.h>
#include <stdio.h>
#include <chrono>

using std::cout;
using std::endl;
using std::chrono::high_resolution_clock;
using std::chrono::duration_cast;
using std::chrono::microseconds;




int main(int argc, char **argv) {
    char *file   = argv[1];
    char *output = argv[2];
    igraph_t g;
    // Read the graph from a Matrix Market file.
    cout << "Reading graph from file " << file << " ..." << endl;
    FILE *f = fopen(file, "r");
    igraph_read_graph_edgelist(&g, f, 0, false);
    Graph graph(&g);
    cout << "Graph has " << graph.vcount() << " vertices and " << graph.ecount() << " edges." << endl;
    // Optimise the partitions using modularity.
    RBConfigurationVertexPartition part(&graph);
    Optimiser o;
    o.set_rng_seed(0);
    auto start = high_resolution_clock::now();
    o.optimise_partition(&part);
    auto stop  = high_resolution_clock::now();
    float duration = duration_cast<microseconds>(stop - start).count() / 1000.0f;
    cout << "Optimisation took " << duration << " ms." << endl;
    // Output the resulting modularity.
    cout << "Modularity: " << part.quality(1.0) << endl;
    // Count the number of vertices in each community.
    vector<size_t> counts(graph.vcount());
    for (size_t i = 0; i < graph.vcount(); i++)
        counts[part.membership(i)]++;
    for (size_t i = 0; i < graph.vcount(); i++) {
        if (counts[i] < 10000) continue;
        cout << "Community " << i << " has " << counts[i] << " vertices." << endl;
    }
    // Save the resulting partition to a file.
    cout << "Saving partition to file " << file << ".part ..." << endl;
    FILE *fout = fopen(output, "w");
    for (size_t i = 0; i < graph.vcount(); i++)
        fprintf(fout, "%zu %zu\n", i, part.membership(i)+1);
    fclose(fout);
    // Clean up.
    igraph_destroy(&g);
    fclose(f);
}
