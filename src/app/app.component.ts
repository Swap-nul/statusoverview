import { OverlayContainer } from '@angular/cdk/overlay';
import { Component } from '@angular/core';
import { MatIconRegistry } from "@angular/material/icon";
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})


export class AppComponent {
  constructor(private matIconRegistry: MatIconRegistry, private domSanitizer: DomSanitizer, private overlay: OverlayContainer) {
    this.matIconRegistry

      .addSvgIcon(`app`, this.domSanitizer.bypassSecurityTrustResourceUrl("../assets/icons/app.svg"))
      .addSvgIcon(`link`, this.domSanitizer.bypassSecurityTrustResourceUrl("../assets/icons/link.svg"))
      .addSvgIcon(`externalLink`, this.domSanitizer.bypassSecurityTrustResourceUrl("../assets/icons/externalLink.svg"))
      .addSvgIcon(`argo`, this.domSanitizer.bypassSecurityTrustResourceUrl("../assets/icons/argo.svg"))
      .addSvgIcon(`argo_logo`, this.domSanitizer.bypassSecurityTrustResourceUrl("../assets/icons/argo_logo.svg"))
      .addSvgIcon(`kibana`, this.domSanitizer.bypassSecurityTrustResourceUrl("../assets/icons/kibana.svg"))

      .addSvgIcon(`tag`, this.domSanitizer.bypassSecurityTrustResourceUrl("../assets/icons/tag.svg"))
      .addSvgIcon(`env`, this.domSanitizer.bypassSecurityTrustResourceUrl("../assets/icons/env.svg"))
      .addSvgIcon(`endpoint`, this.domSanitizer.bypassSecurityTrustResourceUrl("../assets/icons/endpoint.svg"))
      .addSvgIcon(`http`, this.domSanitizer.bypassSecurityTrustResourceUrl("../assets/icons/http.svg"))

      .addSvgIcon(`progress`, this.domSanitizer.bypassSecurityTrustResourceUrl("../assets/icons/progress.svg"))
      .addSvgIcon(`greenHeart`, this.domSanitizer.bypassSecurityTrustResourceUrl("../assets/icons/greenHeart.svg"))
      .addSvgIcon(`brokenHeart`, this.domSanitizer.bypassSecurityTrustResourceUrl("../assets/icons/brokenHeart.svg"))
      .addSvgIcon(`nullStatus`, this.domSanitizer.bypassSecurityTrustResourceUrl("../assets/icons/nullStatus.svg"))

      .addSvgIcon(`commit`, this.domSanitizer.bypassSecurityTrustResourceUrl("../assets/icons/commit.svg"))
      .addSvgIcon(`hashtag`, this.domSanitizer.bypassSecurityTrustResourceUrl("../assets/icons/hashtag.svg"))
      .addSvgIcon(`message`, this.domSanitizer.bypassSecurityTrustResourceUrl("../assets/icons/message.svg"))
      .addSvgIcon(`person`, this.domSanitizer.bypassSecurityTrustResourceUrl("../assets/icons/person.svg"))

      .addSvgIcon(`deployment`, this.domSanitizer.bypassSecurityTrustResourceUrl("../assets/icons/deployment.svg"))
      .addSvgIcon(`rocket`, this.domSanitizer.bypassSecurityTrustResourceUrl("../assets/icons/rocket.svg"))
      .addSvgIcon(`time`, this.domSanitizer.bypassSecurityTrustResourceUrl("../assets/icons/time.svg"))
      .addSvgIcon(`branch`, this.domSanitizer.bypassSecurityTrustResourceUrl("../assets/icons/branch.svg"))
      .addSvgIcon(`question`, this.domSanitizer.bypassSecurityTrustResourceUrl("../assets/icons/question.svg"))

      .addSvgIcon(`portfolio`, this.domSanitizer.bypassSecurityTrustResourceUrl("../assets/icons/portfolio.svg"))
      .addSvgIcon(`namespace`, this.domSanitizer.bypassSecurityTrustResourceUrl("../assets/icons/namespace.svg"))
      .addSvgIcon(`cluster`, this.domSanitizer.bypassSecurityTrustResourceUrl("../assets/icons/cluster.svg"))

      .addSvgIcon(`close`, this.domSanitizer.bypassSecurityTrustResourceUrl("../assets/icons/close.svg"))

      .addSvgIcon(`info`, this.domSanitizer.bypassSecurityTrustResourceUrl("../assets/icons/info.svg"))
      .addSvgIcon(`copyToClipboard`, this.domSanitizer.bypassSecurityTrustResourceUrl("../assets/icons/copyToClipboard.svg"))
      .addSvgIcon(`springio`, this.domSanitizer.bypassSecurityTrustResourceUrl("../assets/icons/springio.svg"))
      .addSvgIcon(`mulesoft`, this.domSanitizer.bypassSecurityTrustResourceUrl("../assets/icons/mulesoft.svg"))
      .addSvgIcon(`shellscript`, this.domSanitizer.bypassSecurityTrustResourceUrl("../assets/icons/shellscript.svg"))
      .addSvgIcon(`python`, this.domSanitizer.bypassSecurityTrustResourceUrl("../assets/icons/python.svg"))
      .addSvgIcon(`nodejs`, this.domSanitizer.bypassSecurityTrustResourceUrl("../assets/icons/nodejs.svg"))
      .addSvgIcon(`powershell`, this.domSanitizer.bypassSecurityTrustResourceUrl("../assets/icons/powershell.svg"))
      .addSvgIcon(`react`, this.domSanitizer.bypassSecurityTrustResourceUrl("../assets/icons/react.svg"))
      .addSvgIcon(`dotnet`, this.domSanitizer.bypassSecurityTrustResourceUrl("../assets/icons/dotnet.svg"))

      .addSvgIcon(`dark`, this.domSanitizer.bypassSecurityTrustResourceUrl("../assets/icons/dark.svg"))
      .addSvgIcon(`light`, this.domSanitizer.bypassSecurityTrustResourceUrl("../assets/icons/light.svg"))

      .addSvgIcon(`filter`, this.domSanitizer.bypassSecurityTrustResourceUrl("../assets/icons/filter.svg"))

      .addSvgIcon(`azureRepo`, this.domSanitizer.bypassSecurityTrustResourceUrl("../assets/icons/azureRepo.svg"))
      .addSvgIcon(`github`, this.domSanitizer.bypassSecurityTrustResourceUrl("../assets/icons/github.svg"))
      .addSvgIcon(`github_repo`, this.domSanitizer.bypassSecurityTrustResourceUrl("../assets/icons/github_repo.svg"))

      .addSvgIcon(`sort`, this.domSanitizer.bypassSecurityTrustResourceUrl("../assets/icons/sort.svg"))
      .addSvgIcon(`sort_active`, this.domSanitizer.bypassSecurityTrustResourceUrl("../assets/icons/sort_active.svg"))
      .addSvgIcon(`clear_sort`, this.domSanitizer.bypassSecurityTrustResourceUrl("../assets/icons/clear_sort.svg"))

      .addSvgIcon(`csv`, this.domSanitizer.bypassSecurityTrustResourceUrl("../assets/icons/csv.svg"))


      ;
  }

  addCss = false; // set 'initial state' based on your needs

  refreshCss(darkMode: boolean) {
    const darkClassName = 'darkMode';
    this.addCss = darkMode;
    if (darkMode) {
      this.overlay.getContainerElement().classList.add(darkClassName);
    } else {
      this.overlay.getContainerElement().classList.remove(darkClassName);
    }
  }

}
