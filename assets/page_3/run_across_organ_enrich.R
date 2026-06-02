library(tidyverse)
library(MetaboAnalystR)

out_base <- "/home/kyky2/空代/code for 网站/page_3/across_organ"
dir.create(out_base, recursive = TRUE, showWarnings = FALSE)

file_dir <- "/home/kyky2/空代/All_Organs_Comparison/DE_Analysis_Dynamic_Presto"

organs <- c("heart", "intestine", "kidney", "liver", "lung", "lymph", "spleen", "sternum", "thymus")

for (organ in organs) {

  cat("\n", strrep("=", 60), "\n")
  cat("处理器官：", organ, "\n")

  file_path <- file.path(file_dir, paste0("DE_Result_Dynamic_Presto_", organ, ".csv"))
  cat("文件：", file_path, "\n")

  de_data <- read.csv(file_path)

  sig_mets <- de_data %>%
    filter(p_val < 0.05) %>%
    pull(HMDB) %>%
    na.omit() %>%
    unique()

  cat("显著代谢物数：", length(sig_mets), "\n")

  if (length(sig_mets) < 2) {
    cat("代谢物太少，跳过\n")
    next
  }

  mSet <- InitDataObjects("conc", "pathora", FALSE, default.dpi = 72)
  mSet <- Setup.MapData(mSet, sig_mets)
  mSet <- CrossReferencing(mSet, "hmdb")
  mSet <- CreateMappingResultTable(mSet)
  mSet <- SetMetabolomeFilter(mSet, F)
  mSet <- SetCurrentMsetLib(mSet, "kegg_pathway", 0)
  mSet <- CalculateHyperScore(mSet)

  plot_name <- file.path(out_base, paste0("across_", organ, "_plot"))
  mSet <- PlotORA(mSet, plot_name, "bar", "png", 72, width = NA)

  res_df <- mSet$analSet$ora.mat
  res_path <- file.path(out_base, paste0("across_", organ, "_enrich_result.csv"))
  write.csv(res_df, res_path, row.names = TRUE)

  cat("完成：", organ, "\n")
}

cat("\n所有跨器官富集分析完成！结果在：", out_base, "\n")
