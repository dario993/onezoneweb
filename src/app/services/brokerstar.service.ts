import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  catchError,
  distinctUntilChanged,
  firstValueFrom,
  forkJoin,
  map,
  Observable,
  of,
  switchMap,
} from 'rxjs';
import { environment } from '../../environments/environment';
import { StorageService } from './storage.service';
import { isset } from '../helper';

@Injectable({
  providedIn: 'root',
})
export class BrokerstarService {
  public token: string = '';

  constructor(
    private readonly http: HttpClient,
    private readonly storage: StorageService
  ) {}

  // Authentication
  /*
        Login
        https://wmcch.atlassian.net/wiki/spaces/FAQ/pages/557833/API+Authentication#API%3AAuthentication-Login
        POST /api/v3/login
    */
  public login(username: string, password: string): Observable<unknown> {
    const formData: Record<string, unknown> = {
      username: username,
      password: password,
    };

    return this.http.post(environment.apiEndpoint + '/login', formData);
  }

  /*
        Logout
        https://wmcch.atlassian.net/wiki/spaces/FAQ/pages/557833/API+Authentication#API%3AAuthentication-Logout
        GET /api/v3/logout
    */
  public logout(): Observable<unknown> {
    return this.http
      .get(`${environment.apiEndpoint}/contact`, {
        headers: {
          Authorization: 'Bearer ' + this.token,
        },
      })
      .pipe(
        map((data: any): any => data),
        catchError((_error: HttpErrorResponse): any => of({}))
      );
  }

  // Contact
  /*
        Contact list
        https://wmcch.atlassian.net/wiki/spaces/FAQ/pages/557703/API+Contact#API%3AContact-Contactlist
        GET /api/v3/contact
    */
  public registerUser(
    registerData: Record<string, unknown>
  ): Observable<unknown> {
    return this.http.post(
      `${environment.apiEndpoint}/user/register`,
      registerData,
      {
        headers: {
          Accept: 'application/json',
        },
        responseType: 'json',
      }
    );
  }

  public addSubcontact(
    registerData: Record<string, unknown>
  ): Observable<unknown> {
    return this.http
      .post(`${environment.apiEndpoint}/contact`, registerData, {
        headers: {
          Authorization: 'Bearer ' + this.token,
          Accept: 'application/json',
        },
        responseType: 'json',
      })
      .pipe(
        map((data: any): any => data),
        catchError((error: HttpErrorResponse): any => {
          console.log(error);
          return of([]);
        })
      );
  }
  public contactRelation(
    page: number = 1,
    limit: number = 100,
    contact_login_id?: string,
    contact_id?: string
  ): Observable<unknown> {
    // convert requestParams to query string
    let queryString: string = '?';
    if (page !== 1) {
      queryString += `page=${page}&`;
    }
    if (limit !== 100) {
      queryString += `limit=${limit}&`;
    }
    if (contact_login_id) {
      queryString += `contact_login_id=${contact_login_id}&`;
    }
    if (contact_id) {
      queryString += `contact_id=${contact_id}&`;
    }
    queryString = queryString.slice(0, -1);

    // Fetch contact relations
    return this.http
      .get(`${environment.apiEndpoint}/contact/relation${queryString}`, {
        headers: {
          Authorization: 'Bearer ' + this.token,
        },
        responseType: 'json',
      })
      .pipe(
        distinctUntilChanged(
          (prev: any, curr: any): boolean => prev.length === curr.length
        ),
        map((data: any): any => data),
        catchError((error: HttpErrorResponse): any => {
          console.log(error);
          return of({});
        })
      );
  }

  public contactContactList(
    requestParams: Record<string, any> = {}
  ): Observable<unknown> {
    // Entferne page und limit aus requestParams falls vorhanden, da wir diese selbst verwalten
    const { page, limit, ...otherParams } = requestParams;

    // Erste Anfrage um die Gesamtanzahl der Seiten zu ermitteln
    return this.loadContactPage(1, otherParams).pipe(
      map((firstPageData: any) => {
        if (!firstPageData?.pages) {
          return firstPageData;
        }

        const totalPages = firstPageData.pages;
        const allContacts = firstPageData.data || [];

        // Wenn nur eine Seite vorhanden ist, gib das Ergebnis direkt zurück
        if (totalPages <= 1) {
          return firstPageData;
        }

        // Erstelle Observables für alle weiteren Seiten
        const pageObservables: Observable<any>[] = [];
        for (let pageNum = 2; pageNum <= totalPages; pageNum++) {
          pageObservables.push(this.loadContactPage(pageNum, otherParams));
        }

        // Lade alle weiteren Seiten parallel
        return forkJoin(pageObservables).pipe(
          map((allPagesData: any[]) => {
            // Sammle alle Kontakte von allen Seiten
            for (const pageData of allPagesData) {
              if (pageData?.data) {
                allContacts.push(...pageData.data);
              }
            }

            // Gib das Ergebnis im gleichen Format zurück wie die ursprüngliche API
            return {
              ...firstPageData,
              data: allContacts,
              page: 1,
              pages: totalPages,
              total: firstPageData.total,
            };
          })
        );
      }),
      // Flatten das Observable falls es verschachtelt ist
      switchMap((result: any) => {
        if (result && typeof result.subscribe === 'function') {
          return result;
        }
        return of(result);
      }),
      catchError((error: HttpErrorResponse): any => {
        console.log(error);
        return of([]);
      })
    );
  }

  public loadContactPage(
    page: number,
    requestParams: Record<string, any> = {}
  ): Observable<any> {
    // convert requestParams to query string
    let queryString: string = '?';
    queryString += `page=${page}&`;

    for (const key in requestParams) {
      if (requestParams.hasOwnProperty(key)) {
        queryString += `${key}=${requestParams[key]}&`;
      }
    }
    queryString = queryString.slice(0, -1);

    return this.http
      .get(`${environment.apiEndpoint}/contact${queryString}`, {
        headers: {
          Authorization: 'Bearer ' + this.token,
        },
        responseType: 'json',
      })
      .pipe(
        distinctUntilChanged(
          (prev: any, curr: any): boolean => prev.length === curr.length
        ),
        map((data: any): any => data),
        catchError((error: HttpErrorResponse): any => {
          console.log(error);
          return of({ data: [], page: page, pages: 0, total: 0 });
        })
      );
  }

  /*
        Contact list
        https://wmcch.atlassian.net/wiki/spaces/FAQ/pages/557703/API+Contact#API%3AContact-Contactlist
        GET /api/v3/contact
    */
  public contact(contactid: number): Observable<unknown> {
    return this.http
      .get(`${environment.apiEndpoint}/contact/${contactid}`, {
        headers: {
          Authorization: 'Bearer ' + this.token,
        },
        responseType: 'json',
      })
      .pipe(
        distinctUntilChanged(
          (prev: any, curr: any): boolean => prev.length === curr.length
        ),
        map((data: any): any => data),
        catchError((error: HttpErrorResponse): any => {
          console.log(error);
          return of({});
        })
      );
  }

  public changeContact(contactid: string, payload: any): Observable<unknown> {
    return this.http
      .put(`${environment.apiEndpoint}/contact/${contactid}`, payload, {
        headers: {
          Authorization: 'Bearer ' + this.token,
          Accept: 'application/json',
        },
        responseType: 'json',
      })
      .pipe(
        catchError((error: HttpErrorResponse): any => {
          console.log(error);
          return of({});
        })
      );
  }

  public changeContactPassword(payload: any): Observable<unknown> {
    return this.http
      .post(`${environment.apiEndpoint}/user/change-password`, payload, {
        headers: {
          Authorization: 'Bearer ' + this.token,
          Accept: 'application/json',
        },
        responseType: 'json',
      })
      .pipe(
        catchError((error: HttpErrorResponse): any => {
          console.log(error);
          return of({});
        })
      );
  }

  /*
        Get avatar file
        https://wmcch.atlassian.net/wiki/spaces/FAQ/pages/557703/API+Contact#API%3AContact-Getavatarfile
        GET /api/v3/contact/avatar/{contact}
    */
  public contactGetAvatar(contact: number): Observable<unknown> {
    return this.http
      .get(`${environment.apiEndpoint}/contact/avatar/${contact}`, {
        headers: {
          Authorization: 'Bearer ' + this.token,
        },
        responseType: 'blob',
      })
      .pipe(
        distinctUntilChanged(
          (prev: any, curr: any): boolean => prev.length === curr.length
        ),
        map((data: any): any => data),
        catchError((_error: HttpErrorResponse): any => {
          return of({});
        })
      );
  }

  // User
  /*
        Me
        https://wmcch.atlassian.net/wiki/spaces/FAQ/pages/557591/API+User#API%3AUser-Me
        GET /api/v3/user/me
    */
  public userMe(): Observable<unknown> {
    return this.http
      .get(environment.apiEndpoint + '/user/me', {
        headers: {
          Authorization: 'Bearer ' + this.token,
        },
        responseType: 'json',
      })
      .pipe(
        distinctUntilChanged(
          (prev: any, curr: any): boolean => prev.length === curr.length
        ),
        catchError((error: HttpErrorResponse): any => {
          console.log(error);
          return of({});
        })
      );
  }
  /*
        Me
        https://wmcch.atlassian.net/wiki/spaces/FAQ/pages/557591/API+User#API%3AUser-Me
        GET /api/v3/user/me
    */
  public userMeUpdate(formData: Record<string, unknown>): Observable<unknown> {
    return this.http
      .post(environment.apiEndpoint + '/user/me', formData, {
        headers: {
          Authorization: 'Bearer ' + this.token,
        },
      })
      .pipe(
        catchError((error: HttpErrorResponse): any => {
          console.log(error);
          return of([]);
        })
      );
  }

  // CustomerPortalMenu
  /*
        Conversation list
        https://wmcch.atlassian.net/wiki/spaces/FAQ/pages/4292609/API+Chat#API%3AChat-Conversationlist
        GET /api/v3/chat/conversations
    */
  public customerportalmenu(level: number | string): Observable<unknown> {
    // check if menu are already loaded in storage
    const cache: any = this.storage.getItem(`customerportalmenu${level}`);
    if (cache) {
      return of(JSON.parse(cache));
    }

    return this.http
      .get<unknown[]>(
        environment.apiEndpoint + '/customerportalmenu/list/' + String(level),
        {
          headers: {
            Authorization: 'Bearer ' + this.token,
          },
          responseType: 'json',
        }
      )
      .pipe(
        distinctUntilChanged(
          (prev: unknown[], curr: unknown[]): boolean =>
            prev.length === curr.length
        ),
        map((data: any): any => {
          this.storage.setItem(
            `customerportalmenu${level}`,
            JSON.stringify(data)
          );
          return data;
        }),
        catchError((error: HttpErrorResponse): any => {
          console.log(error);
          return of([] as unknown[]);
        })
      );
  }

  /*
        Conversation messages
        https://wmcch.atlassian.net/wiki/spaces/FAQ/pages/4292609/API+Chat#API%3AChat-Conversationmessages
        GET /api/v3/chat/messages/{user_id}
    */
  public chatConversationMessages(
    userid: number,
    limit?: number,
    page?: number,
    lastid?: number
  ): Observable<any> {
    let urlChatMessages: string =
      environment.apiEndpoint + '/chat/messages/' + String(userid);
    urlChatMessages += '?sort=chat.id&order=desc';
    urlChatMessages +=
      limit !== undefined && page !== undefined
        ? '&limit=' + String(limit) + '&page=' + String(page)
        : '';
    urlChatMessages += isset(lastid)
      ? '&filters[last_id]=' + String(lastid)
      : '';

    let urlSystemMessages: string = environment.apiEndpoint + '/chat/messages';
    urlSystemMessages += '?sort=chat.id&order=desc';
    urlSystemMessages +=
      limit !== undefined && page !== undefined
        ? '&limit=' + String(limit) + '&page=' + String(page)
        : '';
    urlSystemMessages += isset(lastid)
      ? '&filters[last_id]=' + String(lastid)
      : '';

    const chatMessages$: Observable<unknown> = this.http
      .get(urlChatMessages, {
        headers: {
          Authorization: 'Bearer ' + this.token,
        },
        responseType: 'json',
      })
      .pipe(
        distinctUntilChanged(
          (prev: any, curr: any): boolean => prev.length === curr.length
        ),
        catchError((error: HttpErrorResponse): any => {
          console.log(error);
          return of([]);
        })
      );

    const systemMessages$: Observable<unknown> = this.http
      .get(urlSystemMessages, {
        headers: {
          Authorization: 'Bearer ' + this.token,
        },
        responseType: 'json',
      })
      .pipe(
        distinctUntilChanged(
          (prev: any, curr: any): boolean => prev.length === curr.length
        ),
        catchError((error: HttpErrorResponse): any => {
          console.log(error);
          return of([]);
        })
      );

    return forkJoin([chatMessages$, systemMessages$]).pipe(
      map((data: any): unknown[] => {
        const chatMessages: any = data[0];
        const systemMessages: Record<string, any> = data[1];
        if (isset(chatMessages.data) && isset(systemMessages['data'])) {
          chatMessages.data = (chatMessages.data as unknown[]).concat(
            systemMessages['data']
          );
        }
        return chatMessages;
      })
    );
  }

  /*
        Get flooded chat
        https://wmcch.atlassian.net/wiki/spaces/FAQ/pages/4292609/API+Chat#API%3AChat-Getfloodedchat
        GET /api/v3/chat/flooded
    */
  public chatFloodedChat(): Observable<unknown> {
    return this.http
      .get(environment.apiEndpoint + '/chat/flooded', {
        headers: {
          Authorization: 'Bearer ' + this.token,
        },
        responseType: 'json',
      })
      .pipe(
        distinctUntilChanged(
          (prev: any, curr: any): boolean => prev.length === curr.length
        ),
        catchError((error: HttpErrorResponse): any => {
          console.log(error);
          return of([]);
        })
      );
  }

  /*
        Post Message
        https://wmcch.atlassian.net/wiki/spaces/FAQ/pages/4292609/API+Chat#API%3AChat-PostMessage
        POST /api/v3/chat
    */
  public chatPostMessage(message: string, userid: number): Observable<unknown> {
    if (message.length === 0) {
      return of({});
    }

    const formData: Record<string, unknown> = {
      message: message,
      user: String(userid),
    };

    return this.http
      .post(environment.apiEndpoint + '/chat', formData, {
        headers: {
          Authorization: 'Bearer ' + this.token,
        },
      })
      .pipe(
        catchError((error: HttpErrorResponse): any => {
          console.log(error);
          return of([]);
        })
      );
  }

  /*
        Mute conversation
        https://wmcch.atlassian.net/wiki/spaces/FAQ/pages/4292609/API+Chat#API%3AChat-Muteconversation
        GET /api/v3/chat/mute/{user_id}
    */
  public chatMuteConversation(userid: number): Observable<unknown> {
    return this.http
      .get(environment.apiEndpoint + '/chat/mute/' + String(userid), {
        headers: {
          Authorization: 'Bearer ' + this.token,
        },
        responseType: 'json',
      })
      .pipe(
        distinctUntilChanged(
          (prev: any, curr: any): boolean => prev.length === curr.length
        ),
        catchError((error: HttpErrorResponse): any => {
          console.log(error);
          return of([]);
        })
      );
  }

  /*
        Document Category Item
        https://wmcch.atlassian.net/wiki/spaces/FAQ/pages/557687/API+Document+Category+Item
        GET /api/v3/document-category-item
    */
  public getDocumentCategoryItemInfo(contact: string): Observable<unknown> {
    // eslint-disable-next-line max-len
    return this.http
      .get(
        `${environment.apiEndpoint}/document-category/item?document_category=1&module=1&add_contact_files=${contact}`,
        {
          headers: {
            Authorization: 'Bearer ' + this.token,
          },
          responseType: 'json',
        }
      )
      .pipe(
        distinctUntilChanged(
          (prev: any, curr: any): boolean => prev.length === curr.length
        ),
        catchError((error: HttpErrorResponse): any => {
          console.log(error);
          return of({});
        })
      );
  }

  // Claim
  /*
        Inform Insurances
        https://wmcch.atlassian.net/wiki/spaces/FAQ/pages/557817/API+Claim#API%3AClaim-InformInsurances
        POST /api/v3/claim/inform-insurances/{id}
    */
  public claimInformInsurances(claimid: number): Observable<unknown> {
    return this.http
      .post(
        environment.apiEndpoint + '/claim/inform-insurances/' + String(claimid),
        {
          _sendMail: true,
        },
        {
          headers: {
            Authorization: 'Bearer ' + this.token,
          },
        }
      )
      .pipe(
        catchError((error: HttpErrorResponse): any => {
          console.log(error);
          return of([]);
        })
      );
  }

  public createClaim(
    policyid: number,
    datetime: string,
    info: string
  ): Observable<unknown> {
    return this.http
      .post(
        `${environment.apiEndpoint}/claim/${policyid}`,
        {
          dateTime: datetime,
          info: info,
        },
        {
          headers: {
            Authorization: 'Bearer ' + this.token,
          },
        }
      )
      .pipe(
        catchError((error: HttpErrorResponse): any => {
          console.log(error);
          return of(undefined);
        })
      );
  }

  // Mandate
  /*
        Inform Insurances
        https://wmcch.atlassian.net/wiki/spaces/FAQ/pages/557639/API+Mandate#API%3AMandate-InformInsurances
        POST /api/v3/mandate/inform-insurances
    */
  public mandateInformInsurances(
    newMandate: boolean = false,
    insurances: Record<string, boolean> = {}
  ): Observable<unknown> {
    return this.http
      .post(
        environment.apiEndpoint + '/mandate/inform-insurances',
        {
          new_mandate: newMandate,
          _sendMail: true,
          insurances: insurances,
        },
        {
          headers: {
            Authorization: 'Bearer ' + this.token,
          },
        }
      )
      .pipe(
        catchError((error: HttpErrorResponse): any => {
          console.log(error);
          return of([]);
        })
      );
  }

  // Quotation
  /*
        Inform Insurances
        https://wmcch.atlassian.net/wiki/spaces/FAQ/pages/557663/API+Quotation#API%3AQuotation-Quotationlist
        POST /api/v3/mandate/inform-insurances
    */
  public quotation(): Observable<unknown> {
    // check if quotations are already loaded in storage
    const quotations: any = this.storage.getItem('quotations');
    if (quotations) {
      return of(JSON.parse(quotations));
    }

    return this.http
      .get(environment.apiEndpoint + '/quotation', {
        headers: {
          Authorization: 'Bearer ' + this.token,
        },
        responseType: 'json',
      })
      .pipe(
        distinctUntilChanged(
          (prev: any, curr: any): boolean => prev.length === curr.length
        ),
        map((data: any): any => {
          this.storage.setItem('quotations', JSON.stringify(data));
          return data;
        }),
        catchError((error: HttpErrorResponse): any => {
          console.log(error);
          return of({});
        })
      );
  }

  // policy
  /*
        Policy list
        https://wmcch.atlassian.net/wiki/spaces/FAQ/pages/557615/API+Policy#API%3APolicy-Policylist
        GET /api/v3/policy
    */
  public policyList(
    requestParams: Record<string, any> = {}
  ): Observable<unknown> {
    // convert requestParams to query string
    let queryString: string = '?';
    for (const key in requestParams) {
      if (requestParams.hasOwnProperty(key)) {
        queryString += `${key}=${requestParams[key]}&`;
      }
    }
    queryString = queryString.slice(0, -1);
    return this.http
      .get(`${environment.apiEndpoint}/policy${queryString}`, {
        headers: {
          Authorization: 'Bearer ' + this.token,
        },
        responseType: 'json',
      })
      .pipe(
        distinctUntilChanged(
          (prev: any, curr: any): boolean => prev.length === curr.length
        ),
        catchError((error: HttpErrorResponse): any => {
          console.log(error);
          return of([]);
        })
      );
  }

  public policy(policyid: string): Observable<unknown> {
    return this.http
      .get(
        `${environment.apiEndpoint}/policy/${policyid}?show_policy_document=true`,
        {
          headers: {
            Authorization: 'Bearer ' + this.token,
          },
          responseType: 'json',
        }
      )
      .pipe(
        distinctUntilChanged(
          (prev: any, curr: any): boolean => prev.length === curr.length
        ),
        map((data: any): any => {
          return data;
        }),
        catchError((error: HttpErrorResponse): any => {
          console.log(error);
          return of([]);
        })
      );
  }

  public premiumInvoice(policyid: string): Observable<unknown> {
    return this.http
      .get(
        `${environment.apiEndpoint}/premium-invoice?policies=${policyid}&invoice_statuses=3,4`,
        {
          headers: {
            Authorization: 'Bearer ' + this.token,
          },
          responseType: 'json',
        }
      )
      .pipe(
        distinctUntilChanged(
          (prev: any, curr: any): boolean => prev.length === curr.length
        ),
        map((data: any): any => {
          // user object where date "endDate" is the greatest date
          if (data.data && data.data.length > 0) {
            data.data.sort((a: any, b: any): number => {
              return (
                new Date(b.endDate).getTime() - new Date(a.endDate).getTime()
              );
            });
          }
          // return the first element
          return data.data[0] || {};
        }),
        catchError((error: HttpErrorResponse): any => {
          console.log(error);
          return of([]);
        })
      );
  }

  public fileInfo(fileid: string): Observable<unknown> {
    return this.http
      .get(`${environment.apiEndpoint}/file/${fileid}`, {
        headers: {
          Authorization: 'Bearer ' + this.token,
        },
        responseType: 'json',
      })
      .pipe(
        distinctUntilChanged(
          (prev: any, curr: any): boolean => prev.length === curr.length
        ),
        map((data: any): any => {
          return data;
        }),
        catchError((error: HttpErrorResponse): any => {
          console.log(error);
          return of(undefined);
        })
      );
  }

  public file(fileid: string): Observable<unknown> {
    return this.http
      .get(`${environment.apiEndpoint}/file/${fileid}/download`, {
        headers: {
          Authorization: 'Bearer ' + this.token,
        },
        responseType: 'blob',
      })
      .pipe(
        distinctUntilChanged(
          (prev: any, curr: any): boolean => prev.length === curr.length
        ),
        map((data: Blob): Blob => {
          return data;
        }),
        catchError((error: HttpErrorResponse): any => {
          console.log(error);
          return of(undefined);
        })
      );
  }

  public insurance(): Observable<unknown> {
    return this.http
      .get(`${environment.apiEndpoint}/contact/insurance`, {
        headers: {
          Authorization: 'Bearer ' + this.token,
        },
        responseType: 'json',
      })
      .pipe(
        distinctUntilChanged(
          (prev: any, curr: any): boolean => prev.length === curr.length
        ),
        map((data: any): any => {
          return data;
        }),
        catchError((error: HttpErrorResponse): any => {
          console.log(error);
          return of([]);
        })
      );
  }

  public confirmResetPassword(
    formData: Record<string, unknown>
  ): Observable<unknown> {
    return this.http
      .post(environment.apiEndpoint + '/user/confirm-reset-password', formData)
      .pipe(
        catchError((error: HttpErrorResponse): any => {
          console.log(error);
          return of([]);
        })
      );
  }

  public resetPassword(formData: Record<string, unknown>): Observable<unknown> {
    return this.http
      .post(environment.apiEndpoint + '/user/reset-password', formData)
      .pipe(
        catchError((error: HttpErrorResponse): any => {
          console.log(error);
          return of([]);
        })
      );
  }

  public tender(): Observable<unknown> {
    return this.http
      .get(`${environment.apiEndpoint}/tender`, {
        headers: {
          Authorization: 'Bearer ' + this.token,
        },
        responseType: 'json',
      })
      .pipe(
        distinctUntilChanged(
          (prev: any, curr: any): boolean => prev.length === curr.length
        ),
        map((data: any): any => {
          return data;
        }),
        catchError((error: HttpErrorResponse): any => {
          console.log(error);
          return of([]);
        })
      );
  }

  public tenderOffer(tenderid: string): Observable<unknown> {
    return this.http
      .get(`${environment.apiEndpoint}/tender/offer?tender=${tenderid}`, {
        headers: {
          Authorization: 'Bearer ' + this.token,
        },
        responseType: 'json',
      })
      .pipe(
        distinctUntilChanged(
          (prev: any, curr: any): boolean => prev.length === curr.length
        ),
        map((data: any): any => {
          return data;
        }),
        catchError((error: HttpErrorResponse): any => {
          console.log(error);
          return of([]);
        })
      );
  }

  public tenderOfferAccept(offerid: string): Observable<unknown> {
    return this.http
      .post(
        `${environment.apiEndpoint}/tender/offer/${offerid}/accept`,
        {},
        {
          headers: {
            Authorization: 'Bearer ' + this.token,
            Accept: 'application/json',
          },
          responseType: 'json',
        }
      )
      .pipe(
        catchError((error: HttpErrorResponse): any => {
          console.log(error);
          return of([]);
        })
      );
  }

  public tenderOfferReject(offerid: string): Observable<unknown> {
    return this.http
      .post(
        `${environment.apiEndpoint}/tender/offer/${offerid}/reject`,
        {},
        {
          headers: {
            Authorization: 'Bearer ' + this.token,
            Accept: 'application/json',
          },
          responseType: 'json',
        }
      )
      .pipe(
        catchError((error: HttpErrorResponse): any => {
          console.log(error);
          return of([]);
        })
      );
  }

  public contactFiles(contactid: string): Observable<unknown> {
    return this.http
      .get(
        `${environment.apiEndpoint}/document-category/item?module=1&add_contact_files=${contactid}`,
        {
          headers: {
            Authorization: 'Bearer ' + this.token,
          },
          responseType: 'json',
        }
      )
      .pipe(
        distinctUntilChanged(
          (prev: any, curr: any): boolean => prev.length === curr.length
        ),
        map((data: any): any => {
          return data;
        }),
        catchError((error: HttpErrorResponse): any => {
          console.log(error);
          return of([]);
        })
      );
  }

  public createJasperreport(
    reportName: string,
    contactid: number | string
  ): Observable<unknown> {
    return this.http
      .post(
        `${environment.apiEndpoint}/jasperreport/create`,
        {
          reportName: reportName,
          contact: parseInt(String(contactid), 10),
          returnBase64: true,
          fileParameters: {
            publicAccess: true,
            documentCategoryItem: 1,
          },
        },
        {
          headers: {
            Authorization: 'Bearer ' + this.token,
          },
          responseType: 'json',
        }
      )
      .pipe(
        catchError((error: HttpErrorResponse): any => {
          console.log(error);
          return of([]);
        })
      );
  }

  public createSignetJasperreport(
    reportName: string,
    contactid: number | string,
    image: string
  ): Observable<unknown> {
    return this.http
      .post(
        `${environment.apiEndpoint}/jasperreport/create`,
        {
          reportName: reportName,
          contact: parseInt(String(contactid), 10),
          imageBase64: image,
          saveFile: true,
          fileParameters: {
            publicAccess: true,
            documentCategoryItem: 1,
          },
        },
        {
          headers: {
            Authorization: 'Bearer ' + this.token,
          },
          responseType: 'json',
        }
      )
      .pipe(
        catchError((error: HttpErrorResponse): any => {
          console.log(error);
          return of([]);
        })
      );
  }

  public async uploadFile(
    files: File[],
    params: any[] = [],
    claimid: string = ''
  ): Promise<any> {
    const formData = new FormData();

    // for (const param of params) {
    //   formData.append(param.parameterName, param.data);
    // }

    // Add files to FormData
    for (const file of files) {
      formData.append('file[]', file, file.name);
    }

    try {
      const response = await firstValueFrom(
        this.http.post(
          `${environment.apiEndpoint}/file?module=claim&entity_id=${claimid}`,
          formData,
          {
            headers: {
              Authorization: 'Bearer ' + this.token,
            },
          }
        )
      );

      return response;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }

  public async uploadProfileFile(options: any, file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file, file.name);

    try {
      const response = await firstValueFrom(
        this.http.post(
          `${environment.apiEndpoint}/document-category/item/upload/${options.currentUploadEntryid}/${options.profileid}/${options.currentLanguage}`,
          formData,
          {
            headers: {
              Authorization: 'Bearer ' + this.token,
            },
          }
        )
      );

      return response;
    } catch (error) {
      console.error('Error uploading profile file:', error);
      throw error;
    }
  }
}
