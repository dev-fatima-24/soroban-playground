-- CreateTable
CREATE TABLE "contract_interactions" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL DEFAULT 'default',
    "studentId" TEXT,
    "contractName" TEXT NOT NULL,
    "contractAddress" TEXT,
    "functionName" TEXT NOT NULL,
    "parameters" JSONB,
    "result" JSONB,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "transactionHash" TEXT,
    "blockNumber" TEXT,
    "gasUsed" TEXT,
    "executionTime" INTEGER,
    "errorMessage" TEXT,
    "errorDetails" JSONB,
    "network" TEXT NOT NULL DEFAULT 'testnet',
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contract_interactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "contract_interactions_studentId_idx" ON "contract_interactions"("studentId");

-- CreateIndex
CREATE INDEX "contract_interactions_contractName_idx" ON "contract_interactions"("contractName");

-- CreateIndex
CREATE INDEX "contract_interactions_status_idx" ON "contract_interactions"("status");

-- CreateIndex
CREATE INDEX "contract_interactions_timestamp_idx" ON "contract_interactions"("timestamp");

-- CreateIndex
CREATE INDEX "contract_interactions_transactionHash_idx" ON "contract_interactions"("transactionHash");
